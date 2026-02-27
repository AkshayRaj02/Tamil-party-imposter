import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { categories, Difficulty } from './words';
import { Stage, Gender, GameMode, RoundLimit, Player, RoundResult, Session, EVENTS, STORAGE_KEY, DEFAULT_PLAYERS } from './types';
import { MainMenu, Setup, Leaderboard, Sessions } from './components/MetaScreens';
import { Reveal, Discuss, Vote, Result } from './components/GameScreens';
import { Volume2, VolumeX, Moon, Sun, Link, PowerOff } from 'lucide-react';
import { useMultiplayer } from './useMultiplayer';

const rnd = <T,>(a: T[]) => a[Math.floor(Math.random() * a.length)];
const shuffle = <T,>(array: T[]) => [...array].sort(() => Math.random() - 0.5);

export default function App() {
    const { socket, room, isConnected, error, createRoom, joinRoom, updateGameState, leaveRoom } = useMultiplayer();
    const [isOnline, setIsOnline] = useState(false);

    // Check URL for room code to auto-join
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const hostRoomId = params.get('room');
        if (hostRoomId) {
            setIsOnline(true);
            // We need a name to join, so we set stage to a new 'join' stage
            setSt('join');
        }
    }, []);

    const [st, setSt] = useState<Stage | 'join' | 'host_setup'>('mainmenu');
    const [players, setPlayers] = useState<Player[]>(DEFAULT_PLAYERS);

    const [cats, setCats] = useState<string[]>(categories.map(c => c.name));
    const [difficulty, setDifficulty] = useState<Difficulty>('easy');
    const [mode, setMode] = useState<GameMode>('classic');
    const [rl, setRl] = useState<RoundLimit>(5);
    const [dark, setDark] = useState(true);

    const [imposters, setImposters] = useState<number[]>([]);
    const [cat, setCat] = useState('');
    const [crew, setCrew] = useState('');
    const [impWords, setImpWords] = useState<string[]>([]);
    const [event, setEvent] = useState('');

    const [ri, setRi] = useState(0);
    const [rev, setRev] = useState(false);
    const [t, setT] = useState(180);
    const [run, setRun] = useState(false);

    const [votes, setVotes] = useState<number[]>([]);
    const [vi, setVi] = useState(0);

    const [sound, setSound] = useState(true);
    const ac = useRef<AudioContext | null>(null);

    const [rounds, setRounds] = useState<RoundResult[]>([]);
    const [sessions, setSessions] = useState<Session[]>([]);
    const [sid, setSid] = useState(() => `S-${Date.now()}`);
    const [over, setOver] = useState(false);

    useEffect(() => {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) try { setSessions(JSON.parse(raw)); } catch { }
    }, []);

    useEffect(() => localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions)), [sessions]);

    // Timer logic
    useEffect(() => {
        let i: number;
        if (st === 'discuss' && run && t > 0) i = window.setInterval(() => {
            setT(v => v - 1);
        }, 1000);
        return () => clearInterval(i);
    }, [st, run, t]);

    // Cleanup sound
    useEffect(() => () => { ac.current?.close(); }, []);

    // Sync from Server to local state when playing online
    useEffect(() => {
        if (isOnline && room && room.state) {
            if (room.state.st && room.state.st !== st) setSt(room.state.st);
            if (room.state.ri !== undefined) setRi(room.state.ri);
            if (room.state.run !== undefined) setRun(room.state.run);
            if (room.state.t !== undefined) setT(room.state.t);
            if (room.state.vi !== undefined) setVi(room.state.vi);
            if (room.state.votes !== undefined) setVotes(room.state.votes);

            // Setup state sync
            if (room.state.imposters) setImposters(room.state.imposters);
            if (room.state.cat) setCat(room.state.cat);
            if (room.state.crew) setCrew(room.state.crew);
            if (room.state.impWords) setImpWords(room.state.impWords);
            if (room.state.event) setEvent(room.state.event);

            // Player sync - sync server room players to local players
            if (room.status === 'lobby') {
                const mappedPlayers = room.players.map(p => ({
                    name: p.name,
                    gender: 'M' as Gender, // Simplify for online
                    score: players.find(lp => lp.name === p.name)?.score || 0
                }));
                setPlayers(mappedPlayers);
            }
        }
    }, [room, isOnline]);

    // Host timer sync
    useEffect(() => {
        if (isOnline && room && isHost() && st === 'discuss' && t % 5 === 0) {
            updateGameState({ t });
        }
    }, [t, isOnline, room, st]);

    const tone = useCallback((f: number, d = 0.1) => {
        if (!sound) return;
        if (!ac.current) ac.current = new AudioContext();
        const c = ac.current, o = c.createOscillator(), g = c.createGain();
        o.type = 'triangle'; o.frequency.value = f; g.gain.value = 0.0001;
        o.connect(g); g.connect(c.destination);
        const n = c.currentTime;
        g.gain.exponentialRampToValueAtTime(0.1, n + 0.01);
        g.gain.exponentialRampToValueAtTime(0.0001, n + d);
        o.start(n); o.stop(n + d + 0.02);
    }, [sound]);

    const isHost = () => {
        if (!isOnline) return true;
        if (!room) return false;
        return room.players.some(p => p.id === socket?.id && p.isHost);
    };

    const lb = useMemo(() => [...players].sort((a, b) => b.score - a.score || a.name.localeCompare(b.name)), [players]);
    const susp = useMemo(() => {
        const m = new Map<string, number>();
        players.forEach(p => m.set(p.name, 0));
        rounds.forEach(r => r.votesByPlayer.forEach(v => m.set(v, (m.get(v) || 0) + 1)));
        return [...m.entries()].sort((a, b) => b[1] - a[1])[0] || ['-', 0];
    }, [players, rounds]);

    const an = useMemo(() => {
        const all = sessions.flatMap(s => s.rounds);
        const iw = new Map<string, number>();
        const cc = new Map<string, number>();
        all.forEach(r => {
            if (!r.crewWon) r.imposters.forEach(imp => iw.set(imp, (iw.get(imp) || 0) + 1));
            cc.set(r.category, (cc.get(r.category) || 0) + 1);
        });
        return {
            sessions: sessions.length,
            avg: sessions.length ? (all.length / sessions.length).toFixed(1) : '0.0',
            topImp: [...iw.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || '-',
            topCat: [...cc.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || '-'
        };
    }, [sessions]);

    const toggleSound = () => { setSound(s => !s); if (!sound) tone(600, 0.1); };
    const toggleTheme = () => setDark(d => !d);

    const newPassAndPlay = useCallback(() => {
        setIsOnline(false);
        setPlayers(DEFAULT_PLAYERS);
        setRounds([]); setSid(`S-${Date.now()}`); setOver(false);
        setSt('setup'); tone(480);
    }, [tone]);

    const hostOnlineSession = useCallback(() => {
        setIsOnline(true);
        // Prompt for host name immediately
        const name = prompt("Enter your Name:") || "Host";
        createRoom(name);
        setPlayers([{ name, gender: 'M', score: 0 }]);
        setRounds([]); setSid(`S-${Date.now()}`); setOver(false);
        setSt('setup'); tone(480);
    }, [createRoom, tone]);

    const startRound = useCallback(() => {
        if (!isHost()) return; // Only host starts
        if (players.length < 3 || !cats.length) return;

        const impCount = players.length >= 12 ? 3 : (players.length >= 7 ? 2 : 1);
        const shuffledIdxs = shuffle(Array.from({ length: players.length }, (_, i) => i));
        const imps = shuffledIdxs.slice(0, impCount);

        const c = rnd(categories.filter(x => cats.includes(x.name)));
        let cw = rnd(c.wordsByDifficulty[difficulty]);
        let iws = Array(impCount).fill(cw);

        if (mode === 'similar' && c.wordPairs.length) {
            const pair = rnd(c.wordPairs);
            cw = pair.crew;
            iws = Array(impCount).fill(pair.imposter);
        }

        // Pick one imposter to be the spy if we decide to
        let spyIdx = -1;
        // The Spy feature: 1 imposter becomes the spy, meaning they don't get the word.
        if (impCount > 1) {
            spyIdx = imps[Math.floor(Math.random() * imps.length)];
        }

        const newState = {
            imposters: imps,
            spyIndex: spyIdx,
            cat: c.name,
            crew: cw,
            impWords: iws,
            event: rnd(EVENTS),
            ri: 0,
            t: players.length * 60,
            votes: new Array(players.length).fill(-1),
            vi: 0,
            run: false,
            st: 'reveal' as Stage
        };

        if (isOnline) {
            updateGameState(newState);
        } else {
            setCat(newState.cat); setImposters(newState.imposters);
            setCrew(newState.crew); setImpWords(newState.impWords);
            setEvent(newState.event); setRi(newState.ri);
            setT(newState.t); setVotes(newState.votes);
            setVi(newState.vi); setRun(newState.run);
            setRev(false); setSt(newState.st);
            // @ts-ignore
            window.spyIdx = newState.spyIndex;
        }
        tone(520);
    }, [players.length, cats, difficulty, mode, tone, isOnline, isHost, updateGameState]);

    const handleNextPlayerReveal = useCallback(() => {
        if (isOnline) {
            // In online mode, there is no "pass device". Everyone sees 'reveal' at once.
            // We can skip directly to Discuss when the host clicks "Start Discussion"
        } else {
            if (ri < players.length - 1) {
                setRi(v => v + 1); setRev(false);
            } else {
                setSt('discuss'); setRun(true); tone(800);
            }
        }
    }, [ri, players.length, tone, isOnline]);

    const finishVoting = useCallback(() => {
        if (!isHost()) return;
        if (imposters.length === 0 || votes.some(v => v < 0)) return;

        const m = new Map<number, number>();
        votes.forEach(v => m.set(v, (m.get(v) || 0) + 1));

        const sorted = [...m.entries()].sort((a, b) => b[1] - a[1]);
        const maxVotes = sorted[0]?.[1] ?? 0;
        const outIndexes = sorted.filter(entry => entry[1] === maxVotes).map(entry => entry[0]);
        const crewWin = outIndexes.some(idx => imposters.includes(idx));

        const newPlayers = players.map((p, i) => {
            const isImposter = imposters.includes(i);
            if (crewWin) {
                return !isImposter ? { ...p, score: p.score + 2 } : p;
            } else {
                return isImposter ? { ...p, score: p.score + 3 } : p;
            }
        });

        setPlayers(newPlayers);

        const r: RoundResult = {
            id: `R-${Date.now()}`, category: cat, mode, difficulty,
            crewWord: crew, imposterWords: impWords,
            imposters: imposters.map(i => players[i]?.name || 'Unknown'),
            votesByPlayer: votes.map(i => players[i]?.name || 'Unknown'),
            votedOut: outIndexes.map(idx => players[idx]?.name || 'Unknown'),
            crewWon: crewWin, event, playedAt: new Date().toISOString()
        };

        const n = rounds.length + 1;
        const oVr = rl !== 0 && n >= rl;

        if (isOnline) {
            // If online, we don't sync players/rounds state to server entirely, just the stage
            // but we DO need all clients to know who won. For now sync stage.
            updateGameState({ st: 'result' });
        }

        setRounds(v => [r, ...v]);
        setOver(oVr);
        setSt('result');
        tone(crewWin ? 700 : 230, 0.4);
    }, [imposters, votes, cat, mode, difficulty, crew, impWords, players, event, rounds.length, rl, tone, isOnline, isHost, updateGameState]);

    const saveSession = useCallback(() => {
        if (rounds.length) {
            const rec: Session = { id: sid, startedAt: rounds[rounds.length - 1].playedAt, rounds: [...rounds].reverse() };
            setSessions(v => [rec, ...v.filter(s => s.id !== rec.id)]);
        }
        if (isOnline) leaveRoom();
        setSt('sessions');
    }, [rounds, sid, isOnline, leaveRoom]);

    const endSessionAnytime = () => {
        if (confirm("Are you sure you want to end the session early?")) {
            saveSession();
        }
    };

    // Custom MainMenu inside App to have both buttons
    const EnhancedMainMenu = () => (
        <div className="space-y-4 text-center glass-panel p-6 rounded-2xl">
            <h1 className="text-4xl font-bold mb-8 gradient-text">Party Imposter</h1>
            <div className="flex flex-col gap-3">
                <button onClick={newPassAndPlay} className="btn-primary py-4 rounded-xl font-bold">Pass & Play (1 Device)</button>
                <button onClick={() => setSt('host_setup')} className="bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-xl font-bold shadow-lg shadow-blue-500/30">Host Room</button>
                <button onClick={() => setSt('join')} className="bg-indigo-600 hover:bg-indigo-700 text-white py-4 rounded-xl font-bold shadow-lg shadow-indigo-500/30">Join Room by Code</button>
                <button onClick={() => setSt('sessions')} className="btn-secondary py-3 rounded-xl">History</button>
            </div>
        </div>
    );

    const HostSetupScreen = () => {
        const [name, setName] = useState('');
        return (
            <div className="glass-panel p-6 rounded-2xl text-center space-y-4">
                <h2 className="text-2xl font-bold">Host a Room</h2>
                <input className="glass-input rounded-xl px-4 py-3 w-full" placeholder="Your Name" value={name} onChange={e => setName(e.target.value)} />
                <button disabled={!name} onClick={() => {
                    if (name) {
                        setIsOnline(true);
                        createRoom(name);
                        setPlayers([{ name, gender: 'M', score: 0 }]);
                        setRounds([]); setSid(`S-${Date.now()}`); setOver(false);
                        setSt('setup'); tone(480);
                    }
                }} className="btn-primary w-full py-3 rounded-xl font-bold disabled:opacity-50">Create Room</button>
                <button onClick={() => setSt('mainmenu')} className="btn-secondary w-full py-3 rounded-xl font-bold">Back</button>
            </div>
        );
    };

    const JoinScreen = () => {
        const [name, setName] = useState('');
        const [roomCode, setRoomCode] = useState(new URLSearchParams(window.location.search).get('room') || '');
        return (
            <div className="glass-panel p-6 rounded-2xl text-center space-y-4">
                <h2 className="text-2xl font-bold">Join Room</h2>
                <input className="glass-input rounded-xl px-4 py-3 w-full text-center font-mono tracking-widest uppercase" placeholder="Room Code (e.g. A7XK9Q)" value={roomCode} onChange={e => setRoomCode(e.target.value.toUpperCase())} maxLength={6} />
                <input className="glass-input rounded-xl px-4 py-3 w-full" placeholder="Your Name" value={name} onChange={e => setName(e.target.value)} />
                {error && <p className="text-red-400 text-sm">{error}</p>}
                <button disabled={!roomCode || !name} onClick={() => {
                    if (roomCode && name) {
                        setIsOnline(true);
                        joinRoom(roomCode, name);
                    }
                }} className="btn-primary w-full py-3 rounded-xl font-bold disabled:opacity-50">Join Room</button>
                <button onClick={() => { leaveRoom(); setSt('mainmenu'); }} className="btn-secondary w-full py-3 rounded-xl font-bold">Back</button>
            </div>
        );
    };

    const LobbyWaiting = () => (
        <div className="glass-panel p-6 rounded-2xl text-center space-y-6">
            <h2 className="text-2xl font-bold">In Lobby: <span className="text-green-400 font-mono">{room?.id}</span></h2>
            <div className="animate-spin w-8 h-8 rounded-full border-t-2 border-purple-500 mx-auto"></div>
            <p className="text-slate-400">Waiting for host to configure rules and start...</p>

            <div className="text-left bg-black/20 rounded-xl p-4 border border-white/5 space-y-2 mt-4 max-h-40 overflow-y-auto custom-scrollbar">
                <h3 className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-2 block">Players Joined ({players.length})</h3>
                {players.map((p, i) => (
                    <div key={p.name + i} className="flex justify-between items-center bg-white/5 rounded-lg px-3 py-2 text-sm">
                        <span className="truncate">{p.name}</span>
                        {room?.players.find(rp => rp.name === p.name)?.isHost && <span className="text-[10px] bg-yellow-500/20 text-yellow-500 border border-yellow-500/30 px-2 py-0.5 rounded font-bold uppercase">Host</span>}
                    </div>
                ))}
            </div>

            <button onClick={() => { leaveRoom(); setSt('mainmenu'); }} className="btn-secondary w-full py-3 rounded-xl mt-4">Leave Room</button>
        </div>
    );

    return (
        <div className={dark ? 'dark' : 'light'}>
            <div className="min-h-screen relative font-sans text-slate-800 dark:text-slate-100 overflow-x-hidden selection:bg-purple-500/30">
                <div className="mesh-bg" />

                {/* Topbar sticky header */}
                <div className="fixed top-0 left-0 right-0 p-4 z-50 flex justify-between items-center bg-black/20 backdrop-blur border-b border-white/5">
                    <div className="flex items-center gap-2">
                        {isOnline && room && (
                            <div className="flex items-center gap-2 bg-indigo-500/20 px-3 py-1.5 rounded-full border border-indigo-500/30">
                                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
                                <span className="font-mono text-xs font-bold tracking-wider">{room.id}</span>
                                {isHost() && (
                                    <button onClick={() => {
                                        const url = `${window.location.origin}?room=${room.id}`;
                                        navigator.clipboard.writeText(url);
                                        alert('Link copied to clipboard!');
                                    }} className="ml-2 opacity-70 hover:opacity-100 hover:text-indigo-300">
                                        <Link className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                    <div className="flex gap-2">
                        {st !== 'mainmenu' && st !== 'sessions' && st !== 'join' && (
                            <button onClick={endSessionAnytime} className="p-2 rounded-full glass-panel hover:bg-red-500/20 hover:text-red-400 transition-colors mr-2" title="End Session">
                                <PowerOff className="w-5 h-5" />
                            </button>
                        )}
                        <button onClick={toggleSound} className="p-2 rounded-full glass-panel hover:bg-white/10 transition-colors">
                            {sound ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5 text-red-400" />}
                        </button>
                        <button onClick={toggleTheme} className="p-2 rounded-full glass-panel hover:bg-white/10 transition-colors">
                            {dark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                        </button>
                    </div>
                </div>

                <div className="max-w-md mx-auto pt-24 pb-20 px-4 mt-6">
                    <AnimatePresence mode="wait">
                        {st === 'mainmenu' && (
                            <motion.div key="mainm" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                                <EnhancedMainMenu />
                            </motion.div>
                        )}

                        {st === 'host_setup' && (
                            <motion.div key="host" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}>
                                <HostSetupScreen />
                            </motion.div>
                        )}

                        {st === 'join' && (
                            <motion.div key="join" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                                {room ? <LobbyWaiting /> : <JoinScreen />}
                            </motion.div>
                        )}

                        {st === 'setup' && (
                            <motion.div key="setup" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                                {(isHost() || !isOnline) ? (
                                    <Setup sid={sid} players={players} setPlayers={setPlayers} cats={cats} setCats={setCats}
                                        difficulty={difficulty} setDifficulty={setDifficulty} mode={mode} setMode={setMode}
                                        rl={rl} setRl={setRl} onStart={startRound} onBack={() => { if (isOnline) leaveRoom(); setSt('mainmenu') }} isOnline={isOnline} />
                                ) : (
                                    <LobbyWaiting />
                                )}
                            </motion.div>
                        )}

                        {st === 'reveal' && (
                            <motion.div key="rev" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                                {/* If online, pass the specific player index that matches the current user's socket session */}
                                <Reveal
                                    ri={isOnline ? players.findIndex(p => room?.players.some(rp => rp.id === socket?.id && rp.name === p.name)) : ri}
                                    players={players} imposters={imposters} cat={cat} mode={mode}
                                    crewWord={crew} imposterWords={impWords} rev={rev} setRev={setRev}
                                    onNext={handleNextPlayerReveal} onDiscuss={() => {
                                        if (isOnline && isHost()) updateGameState({ st: 'discuss', run: true });
                                        else if (!isOnline) { setSt('discuss'); setRun(true); }
                                    }}
                                    isOnline={isOnline} isHost={isHost()}
                                />
                            </motion.div>
                        )}

                        {st === 'discuss' && (
                            <motion.div key="disc" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.1 }}>
                                <Discuss event={event} t={t} run={run}
                                    setRun={(state: boolean) => { if (isHost()) { isOnline ? updateGameState({ run: state }) : setRun(state) } }}
                                    onVote={() => { if (isHost()) { isOnline ? updateGameState({ st: 'vote', run: false }) : (() => { setRun(false); setSt('vote') })() } }}
                                    isHost={isHost()} />
                            </motion.div>
                        )}

                        {st === 'vote' && (
                            <motion.div key="vote" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                                {/* If online, let everyone vote at once. If offline, iterate vi. */}
                                {isOnline ? (
                                    <div className="glass-panel p-6 rounded-2xl space-y-4">
                                        <h2 className="text-2xl font-bold text-center">Vote Now!</h2>
                                        <div className="grid grid-cols-2 gap-3 mb-6">
                                            {players.map((p, i) => {
                                                // Find my voter index
                                                const myIdx = players.findIndex(player => room?.players.some(rp => rp.id === socket?.id && rp.name === player.name));
                                                const sel = votes[myIdx] === i;
                                                return (
                                                    <button key={p.name + i} onClick={() => {
                                                        if (myIdx >= 0) {
                                                            const n = [...votes]; n[myIdx] = i;
                                                            setVotes(n); updateGameState({ votes: n });
                                                        }
                                                    }} className={`p-3 rounded-xl border text-left ${sel ? 'bg-purple-500/20 border-purple-500' : 'border-white/10'}`}>
                                                        {p.name}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                        {isHost() && <button onClick={finishVoting} className="btn-primary w-full py-3 rounded-xl">Reveal Result (Host)</button>}
                                    </div>
                                ) : (
                                    <Vote vi={vi} players={players} votes={votes} setVote={(i: number) => setVotes(vs => { const n = [...vs]; n[vi] = i; return n; })}
                                        onNext={() => { if (votes[vi] < 0) return; if (vi < players.length - 1) setVi(v => v + 1); else finishVoting(); }}
                                        onBack={() => setSt('discuss')} />
                                )}
                            </motion.div>
                        )}

                        {st === 'result' && (
                            <motion.div key="res" initial={{ opacity: 0, scale: 1.1 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}>
                                <Result last={rounds[0]} players={players} susp={susp} over={over}
                                    onNext={() => isHost() ? (isOnline ? updateGameState({ st: 'leaderboard' }) : setSt('leaderboard')) : {}}
                                    onEnd={startRound} isHost={isHost()} isOnline={isOnline} />
                            </motion.div>
                        )}

                        {st === 'leaderboard' && (
                            <motion.div key="lead" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                                <Leaderboard lb={lb} over={over} onNext={startRound} onSave={saveSession} onEnd={saveSession} isHost={isHost()} />
                            </motion.div>
                        )}

                        {st === 'sessions' && (
                            <motion.div key="sess" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                                <Sessions sessions={sessions} an={an} onNew={() => setSt('mainmenu')} onMenu={() => setSt('mainmenu')} />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}

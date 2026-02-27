import React, { useState } from 'react';
import { Card, Button, Title } from './Shared';
import { Player, Stage, Difficulty, GameMode, Session } from '../types';
import { categories } from '../words';
import { motion } from 'motion/react';
import { Users, Play, History, Trophy, Trash2, UserPlus, Settings, BarChart2 } from 'lucide-react';

export const MainMenu = ({ onStart, onHistory }: { onStart: () => void, onHistory: () => void }) => (
    <Card className="space-y-6 text-center">
        <Title className="text-4xl mb-8">Party Imposter</Title>
        <div className="flex justify-center mb-8">
            <motion.div animate={{ rotate: [0, 5, -5, 0] }} transition={{ repeat: Infinity, duration: 4 }} className="w-24 h-24 bg-gradient-to-tr from-purple-500 to-pink-500 rounded-full flex items-center justify-center shadow-lg shadow-purple-500/30">
                <Users className="w-12 h-12 text-white" />
            </motion.div>
        </div>
        <div className="space-y-4">
            <Button onClick={onStart} className="text-lg py-4"><Play className="w-5 h-5 mr-2" /> Start Session</Button>
            <Button onClick={onHistory} variant="secondary"><History className="w-5 h-5 mr-2" /> Session History</Button>
        </div>
    </Card>
);

export const Setup = ({
    sid, roomCode, players, setPlayers, cats, setCats, difficulty, setDifficulty,
    mode, setMode, rl, setRl, onStart, onBack, isOnline
}: any) => {
    const [name, setName] = useState('');
    const [g, setG] = useState<'M' | 'F'>('M');

    const add = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim() || players.length >= 15) return;
        setPlayers([...players, { name: name.trim(), gender: g, score: 0 }]);
        setName('');
    };

    return (
        <Card className="space-y-6">
            <div className="flex justify-between items-center mb-4">
                <Title className="!mb-0">Setup Game</Title>
                {isOnline && roomCode ? (
                    <div className="flex flex-col items-end">
                        <div className="text-[10px] text-purple-300 font-bold tracking-wider uppercase mb-1">Room Code</div>
                        <div className="text-xl font-mono tracking-widest bg-indigo-500/20 text-indigo-300 px-3 py-1 rounded-lg border border-indigo-500/30">
                            {roomCode}
                        </div>
                    </div>
                ) : (
                    <div className="text-xs font-mono bg-black/20 px-2 py-1 rounded opacity-70">ID: {sid.split('-')[1]}</div>
                )}
            </div>

            {!isOnline && (
                <form onSubmit={add} className="flex gap-2">
                    <input className="glass-input rounded-xl px-4 py-2 flex-1" value={name} onChange={e => setName(e.target.value)} placeholder="Player name..." />
                    <button type="button" onClick={() => setG(g === 'M' ? 'F' : 'M')} className="glass-input px-3 rounded-xl font-bold w-12">{g}</button>
                    <Button className="!w-auto px-4" type="submit"><UserPlus className="w-5 h-5" /></Button>
                </form>
            )}

            <div className={`grid grid-cols-2 gap-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar ${isOnline ? 'mt-4' : ''}`}>
                {players.map((p: Player, i: number) => (
                    <div key={p.name + i} className="flex justify-between items-center bg-black/10 dark:bg-white/5 rounded-lg px-3 py-2 text-sm">
                        <span className="truncate">{p.name}</span>
                        {!isOnline && (
                            <button onClick={() => players.length > 3 && setPlayers(players.filter((_: any, x: number) => x !== i))}
                                disabled={players.length <= 3} className="text-red-400 hover:text-red-300 disabled:opacity-30">
                                <Trash2 className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                ))}
            </div>

            <div className="space-y-4 pt-4 border-t border-white/10 text-sm">
                <div>
                    <label className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-2 block">Difficulty</label>
                    <div className="flex gap-2">
                        {(['easy', 'hard', 'extreme'] as Difficulty[]).map(d => (
                            <button key={d} onClick={() => setDifficulty(d)}
                                className={`flex-1 py-2 rounded-lg capitalize border transition-all ${difficulty === d ? 'border-purple-500 bg-purple-500/20' : 'border-white/10 hover:bg-white/5'}`}>
                                {d}
                            </button>
                        ))}
                    </div>
                </div>

                <div>
                    <label className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-2 block">Settings</label>
                    <div className="grid grid-cols-2 gap-2">
                        <button onClick={() => setMode(mode === 'classic' ? 'similar' : 'classic')}
                            className="py-2 rounded-lg border border-white/10 hover:bg-white/5 flex flex-col items-center">
                            <span className="text-xs opacity-50 mb-1">Mode</span>
                            <span className="capitalize font-medium">{mode}</span>
                        </button>
                        <button onClick={() => setRl(rl === 5 ? 10 : (rl === 10 ? 0 : 5))}
                            className="py-2 rounded-lg border border-white/10 hover:bg-white/5 flex flex-col items-center">
                            <span className="text-xs opacity-50 mb-1">Rounds</span>
                            <span className="font-medium">{rl === 0 ? 'Endless' : rl}</span>
                        </button>
                    </div>
                </div>

                <div>
                    <label className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-2 block flex justify-between">
                        <span>Categories</span>
                        <span className="opacity-70">{cats.length} selected</span>
                    </label>
                    <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                        {categories.map(c => {
                            const sel = cats.includes(c.name);
                            return (
                                <button key={c.name}
                                    onClick={() => setCats((v: string[]) => sel ? (v.length > 1 ? v.filter(x => x !== c.name) : v) : [...v, c.name])}
                                    className={`px-3 py-1.5 rounded-full text-xs transition-colors border ${sel ? 'bg-purple-500/30 border-purple-500/50' : 'bg-black/20 border-white/5 opacity-60'}`}>
                                    {c.name}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            <div className="pt-4 flex gap-3">
                <Button variant="secondary" onClick={onBack} className="!w-1/3">Back</Button>
                <Button onClick={onStart} disabled={players.length < 3 || cats.length === 0} className="!w-2/3">
                    <Play className="w-5 h-5 mr-2" />
                    {players.length < 3 ? `Need ${3 - players.length} more` : "Start Let's Go!"}
                </Button>
            </div>
        </Card>
    );
};

export const Leaderboard = ({ lb, over, onNext, onSave, onEnd }: any) => (
    <Card className="space-y-6 text-center">
        <Title><Trophy className="w-8 h-8 mx-auto mb-2 text-yellow-400" />Leaderboard</Title>
        <div className="space-y-3">
            {lb.map((p: Player, i: number) => (
                <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: i * 0.1 }}
                    key={p.name + i} className={`flex items-center justify-between p-3 rounded-xl ${i === 0 ? 'bg-yellow-500/20 border border-yellow-500/30 font-bold' : 'bg-white/5 border border-white/10'}`}>
                    <div className="flex items-center gap-3">
                        <span className="w-6 text-center font-mono opacity-50">{i + 1}</span>
                        <span>{p.name}</span>
                    </div>
                    <span className="text-purple-400 font-mono text-lg">{p.score} <span className="text-xs opacity-50 tracking-widest uppercase">pts</span></span>
                </motion.div>
            ))}
        </div>
        <div className="flex flex-col gap-3 pt-6">
            {!over ? <Button onClick={onNext}>Next Round</Button> : <Button onClick={onSave} className="bg-green-600 hover:bg-green-700">Save Match</Button>}
            <Button variant="secondary" onClick={onEnd} className="text-red-400 border-red-400/30 hover:bg-red-400/10">End Session completely</Button>
        </div>
    </Card>
);

export const Sessions = ({ sessions, an, onNew, onMenu }: any) => (
    <Card className="space-y-6">
        <Title><BarChart2 className="w-8 h-8 mx-auto mb-2 text-blue-400" />Statistics</Title>
        <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="bg-black/20 rounded-xl p-3 text-center border border-white/5">
                <div className="text-2xl font-bold text-blue-400 mb-1">{an.sessions}</div>
                <div className="opacity-60 text-xs text-slate-400 uppercase tracking-wider">Sessions</div>
            </div>
            <div className="bg-black/20 rounded-xl p-3 text-center border border-white/5">
                <div className="text-2xl font-bold text-pink-400 mb-1">{an.avg}</div>
                <div className="opacity-60 text-xs text-slate-400 uppercase tracking-wider">Avg Rnds</div>
            </div>
            <div className="bg-black/20 rounded-xl p-3 text-center border border-white/5 col-span-2 flex justify-between items-center">
                <div>
                    <div className="opacity-60 text-xs text-slate-400 uppercase tracking-wider mb-1 text-left">Top Imposter</div>
                    <div className="text-lg font-bold text-red-400">{an.topImp}</div>
                </div>
                <div className="text-right">
                    <div className="opacity-60 text-xs text-slate-400 uppercase tracking-wider mb-1">Top Category</div>
                    <div className="text-lg font-bold text-purple-400">{an.topCat}</div>
                </div>
            </div>
        </div>

        <div className="space-y-4 mt-6">
            <h3 className="text-sm text-slate-400 font-semibold uppercase tracking-wider mb-2">Recent Matches</h3>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                {sessions.length === 0 && <div className="text-center opacity-50 py-4 text-sm">No recorded sessions yet.</div>}
                {sessions.map((s: Session) => (
                    <div key={s.id} className="bg-white/5 rounded-lg p-3 text-sm border border-white/5">
                        <div className="flex justify-between items-center mb-1">
                            <b className="font-mono text-xs opacity-70">{s.id.split('-')[1]}</b>
                            <span className="text-purple-400 font-medium">{s.rounds.length} rounds</span>
                        </div>
                        <div className="text-xs opacity-60">{new Date(s.startedAt).toLocaleString()}</div>
                    </div>
                ))}
            </div>
        </div>

        <div className="pt-4 flex gap-3">
            <Button variant="secondary" onClick={onMenu} className="!w-1/3">Back</Button>
            <Button onClick={onNew} className="!w-2/3">New Session</Button>
        </div>
    </Card>
);

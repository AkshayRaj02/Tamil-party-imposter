import React, { useEffect } from 'react';
import { Card, Button, Title } from './Shared';
import { Player, GameMode, RoundResult } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { Eye, EyeOff, Clock, AlertTriangle, UserCheck, ShieldAlert, Check } from 'lucide-react';

export const Reveal = ({ ri, players, imposters, spyIndex, cat, mode, crewWord, imposterWords, rev, setRev, onNext, onDiscuss }: any) => {
    const isImp = imposters.includes(ri);
    const isSpy = spyIndex === ri;
    const curName = players[ri]?.name;

    return (
        <Card className="text-center">
            <Title>பாஸ் செய்யவும்</Title>
            <div className="text-3xl font-bold mb-8 text-white">{curName}</div>

            <div className="mb-8 min-h-[120px] flex items-center justify-center">
                <AnimatePresence mode="wait">
                    {!rev ? (
                        <motion.div key="hidden" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}>
                            <div className="text-slate-400 mb-2">தயாரா, {curName}?</div>
                            <div className="text-xs opacity-50 uppercase tracking-widest">பார்க்க தட்டவும்</div>
                        </motion.div>
                    ) : (
                        <motion.div key="revealed" initial={{ opacity: 0, scale: 1.1 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                            className={`p-6 rounded-2xl w-full border ${isImp ? 'bg-red-500/10 border-red-500/30 text-red-100' : 'bg-blue-500/10 border-blue-500/30 text-blue-100'}`}>

                            <div className="flex justify-center mb-3">
                                {isImp ? <AlertTriangle className="w-10 h-10 text-red-500" /> : <UserCheck className="w-10 h-10 text-blue-500" />}
                            </div>

                            {isImp ? (
                                <div>
                                    <div className="text-2xl font-bold mb-1 text-red-400 tracking-wide uppercase">
                                        {isSpy ? 'ஒற்றன் (SPY)' : 'இம்போஸ்டர்'}
                                    </div>
                                    <div className="text-sm opacity-80 mb-3">ரகசியத்தை காக்கவும்!</div>
                                    <div className="bg-black/30 rounded-lg p-3 inline-block w-full">
                                        <div className="text-xs opacity-60 uppercase mb-1">வகை</div>
                                        <div className="font-medium text-lg text-white">{cat}</div>
                                        {(mode === 'similar' || !isSpy) && (
                                            <div className="mt-3 pt-3 border-t border-white/10">
                                                <div className="text-xs opacity-60 uppercase mb-1">உன் வார்த்தை</div>
                                                <div className="font-bold text-xl text-yellow-300">
                                                    {isSpy ? 'நீ ஒற்றன். வார்த்தை கிடையாது. இம்போஸ்டரை கண்டுபிடித்து உதவு.' : imposterWords[imposters.indexOf(ri)] || imposterWords[0]}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div>
                                    <div className="text-2xl font-bold mb-1 text-blue-400 tracking-wide uppercase">CREWMATE</div>
                                    <div className="bg-black/30 rounded-lg p-3 inline-block w-full mt-2">
                                        <div className="text-xs opacity-60 uppercase mb-1">Category & Word</div>
                                        <div className="text-sm text-slate-300 mb-1">{cat}</div>
                                        <div className="font-bold text-2xl text-white">{crewWord}</div>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <div className="space-y-3">
                <Button onClick={() => setRev(!rev)} variant={rev ? "secondary" : "primary"} className="w-full">
                    {rev ? <><EyeOff className="w-4 h-4 mr-2" /> Hide</> : <><Eye className="w-4 h-4 mr-2" /> Reveal Role</>}
                </Button>
                {rev && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                        <Button onClick={() => rev ? (ri < players.length - 1 ? onNext() : onDiscuss()) : null}
                            className={isImp ? "bg-red-600 hover:bg-red-700 text-white" : "bg-blue-600 hover:bg-blue-700 text-white"}>
                            {ri < players.length - 1 ? 'Next Player' : 'Start Discussion'}
                        </Button>
                    </motion.div>
                )}
            </div>
        </Card>
    );
};

export const Discuss = ({ event, t, run, setRun, onVote }: any) => {
    const ft = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;
    return (
        <Card className="text-center discuss-gradient border border-purple-500/20">
            <div className="bg-white/10 backdrop-blur px-4 py-2 rounded-full inline-flex items-center text-sm font-semibold text-purple-200 mb-8 border border-white/10 shadow-lg">
                <ShieldAlert className="w-4 h-4 mr-2 text-purple-400" /> Event Active
            </div>

            <motion.div animate={{ scale: [1, 1.02, 1] }} transition={{ repeat: Infinity, duration: 2 }} className="mb-10 min-h-[100px] flex items-center justify-center">
                <div className="text-2xl md:text-3xl font-bold leading-tight balance text-white drop-shadow-md">
                    "{event}"
                </div>
            </motion.div>

            <div className="mb-8">
                <div className={`text-6xl font-mono tracking-tighter transition-colors ${t < 30 ? 'text-red-400' : 'text-white'}`}>
                    {ft(t)}
                </div>
                <div className="flex items-center justify-center mt-2 text-xs opacity-50 uppercase tracking-widest">
                    <Clock className="w-3 h-3 mr-1" /> remaining
                </div>
            </div>

            <div className="flex gap-3">
                <Button onClick={() => setRun(!run)} variant="secondary" className="!w-1/3">
                    {run ? 'Pause' : 'Resume'}
                </Button>
                <Button onClick={() => { setRun(false); onVote(); }} className="!w-2/3 shadow-lg shadow-purple-500/30">
                    End & Vote
                </Button>
            </div>
        </Card>
    );
};

export const Vote = ({ vi, players, votes, setVote, onNext, onBack }: any) => (
    <Card>
        <div className="text-center mb-6">
            <Title className="!mb-2">Voting Time</Title>
            <div className="text-sm opacity-80 bg-white/10 py-2 rounded-lg border border-white/5">
                <span className="opacity-60 uppercase text-xs mr-2">Voter:</span>
                <strong className="text-lg text-white">{players[vi]?.name}</strong>
            </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-6">
            {players.map((p: Player, i: number) => {
                const sel = votes[vi] === i;
                return (
                    <button key={p.name + i} onClick={() => setVote(i)}
                        disabled={i === vi}
                        className={`vote-item relative overflow-hidden rounded-xl p-3 text-left border transition-all 
            ${sel ? 'bg-purple-500/20 border-purple-400 shadow-inner' : 'bg-black/20 border-white/5 hover:bg-white/5'} 
            ${i === vi ? 'opacity-30 cursor-not-allowed grayscale' : ''}`}>
                        <span className={`block font-medium ${sel ? 'text-white' : 'text-slate-300'}`}>{p.name}</span>
                        {sel && <motion.div layoutId="vote-check" className="absolute top-3 right-3"><Check className="w-4 h-4 text-purple-400" /></motion.div>}
                    </button>
                );
            })}
        </div>

        <div className="flex gap-3">
            <Button variant="secondary" onClick={onBack} className="!w-1/3">Back</Button>
            <Button disabled={votes[vi] < 0} onClick={onNext} className="!w-2/3">
                {vi < players.length - 1 ? 'Next Voter' : 'Reveal Result'}
            </Button>
        </div>
    </Card>
);

export const Result = ({ last, players, susp, onNext, over, onEnd }: any) => {
    if (!last) return null;
    const isTie = last.votedOut.length > 1;
    const crewWon = last.crewWon;
    // Format the imposters
    const impNames = last.imposters.join(' & ');
    const votedNames = last.votedOut.join(' & ');

    return (
        <Card className="text-center">
            <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="mb-6">
                {crewWon ? (
                    <div className="inline-block bg-green-500/20 text-green-300 border border-green-500/30 px-6 py-2 rounded-full font-bold tracking-widest uppercase mb-4 shadow-[0_0_15px_rgba(34,197,94,0.3)]">
                        Crew Wins
                    </div>
                ) : (
                    <div className="inline-block bg-red-500/20 text-red-300 border border-red-500/30 px-6 py-2 rounded-full font-bold tracking-widest uppercase mb-4 shadow-[0_0_15px_rgba(239,68,68,0.3)]">
                        Imposter Wins
                    </div>
                )}

                <div className="text-sm text-slate-400 uppercase tracking-widest mb-1">Voted Out</div>
                <div className={`text-3xl font-bold ${votedNames.includes(impNames) ? 'text-white' : 'text-red-400'} mb-6`}>
                    {isTie ? `Tie: ${votedNames}` : votedNames}
                </div>
            </motion.div>

            <div className="bg-black/20 border border-white/5 rounded-xl p-4 text-left space-y-3 mb-6">
                <div className="flex justify-between items-center border-b border-white/5 pb-2">
                    <span className="text-xs text-slate-400 uppercase tracking-wider">Imposter(s)</span>
                    <span className="font-bold text-red-400">{impNames}</span>
                </div>
                <div className="flex justify-between items-center border-b border-white/5 pb-2">
                    <span className="text-xs text-slate-400 uppercase tracking-wider">Crew Word</span>
                    <span className="font-medium text-white">{last.crewWord}</span>
                </div>
                {last.mode === 'similar' && (
                    <div className="flex justify-between items-center border-b border-white/5 pb-2">
                        <span className="text-xs text-slate-400 uppercase tracking-wider">Imposter Word(s)</span>
                        <span className="font-medium text-yellow-300">{last.imposterWords.join(', ')}</span>
                    </div>
                )}
                <div className="flex flex-col border-b border-white/5 pb-2">
                    <span className="text-xs text-slate-400 uppercase tracking-wider mb-1">Event</span>
                    <span className="text-sm italic text-slate-300">"{last.event}"</span>
                </div>

                <div className="pt-2">
                    <span className="text-xs text-slate-400 uppercase tracking-wider block mb-2">Vote Tally</span>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                        {players.map((p: Player, i: number) => {
                            const count = last.votesByPlayer.filter((v: string) => v === p.name).length;
                            return count > 0 ? (
                                <div key={p.name + i} className="flex justify-between bg-white/5 px-2 py-1 rounded">
                                    <span className="truncate pr-2">{p.name}</span>
                                    <span className="font-bold text-purple-400">{count}</span>
                                </div>
                            ) : null;
                        })}
                    </div>
                </div>
            </div>

            <div className="flex flex-col gap-3">
                <Button onClick={onNext} variant="secondary">View Leaderboard</Button>
                {!over && <Button onClick={onEnd} className="bg-gradient-to-r from-purple-600 to-pink-600">Next Round</Button>}
            </div>
        </Card>
    );
};

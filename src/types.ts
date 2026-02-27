import { Difficulty } from './words';
export type { Difficulty };

export type Stage = 'mainmenu' | 'setup' | 'reveal' | 'discuss' | 'vote' | 'result' | 'leaderboard' | 'sessions';
export type Gender = 'M' | 'F';
export type GameMode = 'classic' | 'similar';
export type RoundLimit = 0 | 5 | 10;
export type Player = { name: string; gender: Gender; score: number };

export type RoundResult = {
    id: string;
    category: string;
    mode: GameMode;
    difficulty: Difficulty;
    crewWord: string;
    imposterWords: string[]; // For multi-imposters
    imposters: string[];
    votesByPlayer: string[];
    votedOut: string[]; // Might be a tie
    crewWon: boolean;
    event: string;
    playedAt: string;
};

export type Session = { id: string; startedAt: string; rounds: RoundResult[] };

export const EVENTS = [
    'No speaking first 30s',
    'Everyone lies once',
    'No repeating words',
    'One-word answers only 45s',
    'Do not say category',
    'Talk in accents',
    'Speak only in questions',
    'Explain using only 3 words max per sentence',
    'Rhyme your sentences'
];

export const STORAGE_KEY = 'imposter-sessions-v3';
export const DEFAULT_PLAYERS: Player[] = [
    { name: 'Player 1', gender: 'M', score: 0 },
    { name: 'Player 2', gender: 'F', score: 0 },
    { name: 'Player 3', gender: 'M', score: 0 }
];

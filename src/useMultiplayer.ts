import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

export type RoomPlayer = { id: string; name: string; isHost: boolean; ready: boolean };
export type RoomInfo = {
    id: string;
    host: string;
    players: RoomPlayer[];
    status: 'lobby' | 'playing';
    state: any;
};

// Auto-detect the server running on the same host but port 3001
// @ts-ignore
const SERVER_URL = import.meta.env.VITE_SERVER_URL || `http://${window.location.hostname}:3001`;

console.log("INITIALIZING SOCKET CONNECTION TO: ", SERVER_URL);
console.log("ENV VARS AVAILABLE: ", import.meta.env);

export function useMultiplayer() {
    const [socket, setSocket] = useState<Socket | null>(null);
    const [room, setRoom] = useState<RoomInfo | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // Only connect if we decide to play online
        return () => {
            if (socket) socket.disconnect();
        };
    }, []);

    const connect = () => {
        if (!socket) {
            // Ensure connection uses the correct protocol from SERVER_URL
            const newSocket = io(SERVER_URL);

            newSocket.on('connect', () => {
                console.log("SUCCESSFULLY CONNECTED TO SERVER: ", SERVER_URL);
                setIsConnected(true);
            });

            newSocket.on('connect_error', (err) => {
                console.error("SOCKET CONNECTION ERROR: ", err.message);
                console.error("ATTEMPTED URL: ", SERVER_URL);
            });

            newSocket.on('disconnect', () => {
                setIsConnected(false);
                setRoom(null);
                alert("Connection lost. Trying to reconnect...");
            });

            newSocket.on('room_closed', ({ reason }) => {
                alert(`Room closed: ${reason}`);
                setRoom(null);
                setIsConnected(false);
            });

            newSocket.on('room_update', (updatedRoom: RoomInfo) => {
                setRoom(updatedRoom);
            });

            newSocket.on('game_state_update', (statePatch: any) => {
                setRoom(prev => prev ? { ...prev, state: { ...prev.state, ...statePatch } } : null);
            });

            setSocket(newSocket);
            return newSocket;
        }
        return socket;
    };

    const createRoom = (playerName: string) => {
        const s = connect();
        s.emit('create_room', { playerName }, (res: { success: boolean, room?: RoomInfo, error?: string }) => {
            if (res.success && res.room) {
                setRoom(res.room);
                setError(null);
            } else {
                setError(res.error || 'Failed to create room');
            }
        });
    };

    const joinRoom = (roomId: string, playerName: string) => {
        const s = connect();
        s.emit('join_room', { roomId, playerName }, (res: { success: boolean, room?: RoomInfo, error?: string }) => {
            if (res.success && res.room) {
                setRoom(res.room);
                setError(null);
            } else {
                setError(res.error || 'Failed to join room');
            }
        });
    };

    const updateGameState = (newState: any) => {
        if (socket && room) {
            socket.emit('update_game_state', { roomId: room.id, newState });
        }
    };

    const leaveRoom = () => {
        if (socket) {
            socket.disconnect();
            setSocket(null);
            setRoom(null);
            setIsConnected(false);
        }
    };

    return {
        socket,
        room,
        isConnected,
        error,
        createRoom,
        joinRoom,
        updateGameState,
        leaveRoom
    };
}

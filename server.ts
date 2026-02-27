import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';

const app = express();
const httpServer = createServer(app);

// Simple logging
app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
});

const io = new Server(httpServer, {
    cors: {
        origin: [
            "http://localhost:5173",
            "http://localhost:3000",
            "https://yourgame.vercel.app"
        ],
        methods: ["GET", "POST"]
    },
});

// Basic health route for monitoring
app.get("/", (req, res) => {
    res.send("Server is running");
});

export type Player = { id: string; name: string; isHost: boolean; ready: boolean };
export type Room = {
    id: string;
    host: string;
    players: Player[];
    status: 'lobby' | 'playing';
    state: any; // Game state will go here
};

const rooms = new Map<string, Room>();

io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    socket.on('create_room', ({ playerName }, callback) => {
        // Generate a 6-character alphanumeric room code
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let roomId = '';
        for (let i = 0; i < 6; i++) {
            roomId += chars.charAt(Math.floor(Math.random() * chars.length));
        }

        const newRoom: Room = {
            id: roomId,
            host: socket.id,
            players: [{ id: socket.id, name: playerName, isHost: true, ready: false }],
            status: 'lobby',
            state: {}
        };
        rooms.set(roomId, newRoom);
        socket.join(roomId);
        console.log(`Room ${roomId} created by ${playerName}`);
        callback({ success: true, room: newRoom });
    });

    socket.on('join_room', ({ roomId, playerName }, callback) => {
        const room = rooms.get(roomId);
        if (!room) {
            return callback({ success: false, error: 'Room not found' });
        }
        if (room.status !== 'lobby') {
            return callback({ success: false, error: 'Game already in progress' });
        }

        // Check if name is taken
        if (room.players.some(p => p.name.toLowerCase() === playerName.toLowerCase())) {
            return callback({ success: false, error: 'Name already taken in this room' });
        }

        const newPlayer = { id: socket.id, name: playerName, isHost: false, ready: false };
        room.players.push(newPlayer);
        socket.join(roomId);
        console.log(`${playerName} joined room ${roomId}`);

        // Broadcast updated room to all clients in room
        io.to(roomId).emit('room_update', room);
        callback({ success: true, room });
    });

    socket.on('update_game_state', ({ roomId, newState }) => {
        const room = rooms.get(roomId);
        if (room) {
            room.state = { ...room.state, ...newState };
            // Broadcast state ONLY to others, or to everyone if needed
            socket.to(roomId).emit('game_state_update', room.state);
        }
    });

    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
        // Find rooms this player was in and remove them
        rooms.forEach((room, roomId) => {
            const idx = room.players.findIndex(p => p.id === socket.id);
            if (idx !== -1) {
                const wasHost = room.players[idx].isHost;
                room.players.splice(idx, 1);

                if (room.players.length === 0) {
                    rooms.delete(roomId);
                    console.log(`Room ${roomId} deleted (empty)`);
                } else {
                    if (wasHost) {
                        // If host leaves, immediately terminate the room and tell all players
                        io.to(roomId).emit('room_closed', { reason: 'Host disconnected' });
                        rooms.delete(roomId);
                    } else {
                        // Standard player leaves, just update the room
                        io.to(roomId).emit('room_update', room);
                    }
                }
            }
        });
    });
});

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
    console.log(`Socket.IO Server running on port ${PORT}`);
});

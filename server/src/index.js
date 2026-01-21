import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import quizRoutes from './routes/quiz.js';
import gameRoutes from './routes/game.js';
import { setupSocketHandlers } from './socket/handlers.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  }
});

export const prisma = new PrismaClient();

// Middleware
app.use(cors());
app.use(express.json());

// Routes API
app.use('/api/quiz', quizRoutes);
app.use('/api/game', gameRoutes);

// Route de santé
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Serveur Kahoot Clone opérationnel' });
});

// Servir les fichiers statiques du client en production
const clientPath = join(__dirname, '../../client/dist');
app.use(express.static(clientPath));

// Toutes les autres routes renvoient vers le client React (SPA)
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api') && !req.path.startsWith('/socket.io')) {
    res.sendFile(join(clientPath, 'index.html'));
  }
});

// Configuration Socket.io
setupSocketHandlers(io);

// Stockage global pour les parties en cours
export const activeGames = new Map();

const PORT = process.env.PORT || 3001;

httpServer.listen(PORT, () => {
  console.log(`Serveur démarré sur le port ${PORT}`);
});

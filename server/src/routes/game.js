import { Router } from 'express';
import { prisma, activeGames } from '../index.js';
import { customAlphabet } from 'nanoid';

const router = Router();
const generatePin = customAlphabet('0123456789', 6);

// Créer une nouvelle partie
router.post('/create', async (req, res) => {
  try {
    const { quizId } = req.body;

    if (!quizId) {
      return res.status(400).json({ error: 'ID du quiz requis' });
    }

    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      include: {
        questions: {
          orderBy: { order: 'asc' },
          include: {
            answers: {
              orderBy: { order: 'asc' }
            }
          }
        }
      }
    });

    if (!quiz) {
      return res.status(404).json({ error: 'Quiz non trouvé' });
    }

    // Générer un PIN unique
    let pin;
    let existingGame;
    do {
      pin = generatePin();
      existingGame = await prisma.game.findUnique({ where: { pin } });
    } while (existingGame);

    // Créer la partie en base
    const game = await prisma.game.create({
      data: {
        pin,
        quizId,
        status: 'waiting'
      }
    });

    // Stocker la partie active en mémoire avec les données du quiz
    activeGames.set(pin, {
      id: game.id,
      pin,
      quiz,
      status: 'waiting',
      currentQuestionIndex: -1,
      players: new Map(),
      answers: new Map()
    });

    res.status(201).json({ pin, gameId: game.id });
  } catch (error) {
    console.error('Erreur lors de la création de la partie:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Vérifier si une partie existe
router.get('/check/:pin', async (req, res) => {
  try {
    const { pin } = req.params;
    const game = activeGames.get(pin);

    if (!game) {
      return res.status(404).json({ error: 'Partie non trouvée' });
    }

    if (game.status !== 'waiting') {
      return res.status(400).json({ error: 'La partie a déjà commencé' });
    }

    res.json({
      exists: true,
      quizTitle: game.quiz.title,
      playerCount: game.players.size
    });
  } catch (error) {
    console.error('Erreur lors de la vérification de la partie:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Récupérer les résultats d'une partie
router.get('/:pin/results', async (req, res) => {
  try {
    const { pin } = req.params;
    const game = activeGames.get(pin);

    if (!game) {
      return res.status(404).json({ error: 'Partie non trouvée' });
    }

    const players = Array.from(game.players.values())
      .sort((a, b) => b.score - a.score);

    res.json({
      quizTitle: game.quiz.title,
      players,
      totalQuestions: game.quiz.questions.length
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des résultats:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

export default router;

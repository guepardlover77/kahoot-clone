import { Router } from 'express';
import { prisma } from '../index.js';

const router = Router();

// Récupérer tous les quiz
router.get('/', async (req, res) => {
  try {
    const quizzes = await prisma.quiz.findMany({
      include: {
        _count: {
          select: { questions: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(quizzes);
  } catch (error) {
    console.error('Erreur lors de la récupération des quiz:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Récupérer un quiz par ID
router.get('/:id', async (req, res) => {
  try {
    const quiz = await prisma.quiz.findUnique({
      where: { id: req.params.id },
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

    res.json(quiz);
  } catch (error) {
    console.error('Erreur lors de la récupération du quiz:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Créer un nouveau quiz
router.post('/', async (req, res) => {
  try {
    const { title, description, questions } = req.body;

    if (!title || !questions || questions.length === 0) {
      return res.status(400).json({ error: 'Titre et questions requis' });
    }

    const quiz = await prisma.quiz.create({
      data: {
        title,
        description,
        questions: {
          create: questions.map((q, qIndex) => ({
            text: q.text,
            timeLimit: q.timeLimit || 20,
            points: q.points || 1000,
            order: qIndex,
            answers: {
              create: q.answers.map((a, aIndex) => ({
                text: a.text,
                isCorrect: a.isCorrect || false,
                order: aIndex
              }))
            }
          }))
        }
      },
      include: {
        questions: {
          include: {
            answers: true
          }
        }
      }
    });

    res.status(201).json(quiz);
  } catch (error) {
    console.error('Erreur lors de la création du quiz:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Mettre à jour un quiz
router.put('/:id', async (req, res) => {
  try {
    const { title, description, questions } = req.body;

    // Supprimer les anciennes questions
    await prisma.question.deleteMany({
      where: { quizId: req.params.id }
    });

    // Mettre à jour le quiz avec les nouvelles questions
    const quiz = await prisma.quiz.update({
      where: { id: req.params.id },
      data: {
        title,
        description,
        questions: {
          create: questions.map((q, qIndex) => ({
            text: q.text,
            timeLimit: q.timeLimit || 20,
            points: q.points || 1000,
            order: qIndex,
            answers: {
              create: q.answers.map((a, aIndex) => ({
                text: a.text,
                isCorrect: a.isCorrect || false,
                order: aIndex
              }))
            }
          }))
        }
      },
      include: {
        questions: {
          include: {
            answers: true
          }
        }
      }
    });

    res.json(quiz);
  } catch (error) {
    console.error('Erreur lors de la mise à jour du quiz:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Supprimer un quiz
router.delete('/:id', async (req, res) => {
  try {
    await prisma.quiz.delete({
      where: { id: req.params.id }
    });
    res.json({ message: 'Quiz supprimé' });
  } catch (error) {
    console.error('Erreur lors de la suppression du quiz:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

export default router;

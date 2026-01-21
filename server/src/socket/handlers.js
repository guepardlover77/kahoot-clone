import { prisma, activeGames } from '../index.js';

export function setupSocketHandlers(io) {
  io.on('connection', (socket) => {
    console.log('Nouvelle connexion:', socket.id);

    // Hôte: rejoindre la room de la partie
    socket.on('host:join', ({ pin }) => {
      const game = activeGames.get(pin);
      if (!game) {
        socket.emit('error', { message: 'Partie non trouvée' });
        return;
      }

      socket.join(`game:${pin}`);
      socket.join(`host:${pin}`);
      game.hostSocketId = socket.id;

      socket.emit('host:joined', {
        pin,
        quizTitle: game.quiz.title,
        questionCount: game.quiz.questions.length
      });
    });

    // Joueur: rejoindre une partie
    socket.on('player:join', async ({ pin, nickname }) => {
      const game = activeGames.get(pin);
      if (!game) {
        socket.emit('error', { message: 'Partie non trouvée' });
        return;
      }

      if (game.status !== 'waiting') {
        socket.emit('error', { message: 'La partie a déjà commencé' });
        return;
      }

      // Vérifier que le pseudo n'est pas déjà pris
      const existingPlayer = Array.from(game.players.values()).find(
        p => p.nickname.toLowerCase() === nickname.toLowerCase()
      );
      if (existingPlayer) {
        socket.emit('error', { message: 'Ce pseudo est déjà utilisé' });
        return;
      }

      // Créer le joueur
      const player = {
        id: socket.id,
        nickname,
        score: 0,
        streak: 0,
        answers: []
      };

      game.players.set(socket.id, player);
      socket.join(`game:${pin}`);
      socket.data.pin = pin;
      socket.data.playerId = socket.id;

      // Sauvegarder en base
      await prisma.player.create({
        data: {
          id: socket.id,
          nickname,
          gameId: game.id
        }
      });

      socket.emit('player:joined', {
        nickname,
        playerCount: game.players.size
      });

      // Notifier l'hôte
      io.to(`host:${pin}`).emit('player:new', {
        nickname,
        playerCount: game.players.size,
        players: Array.from(game.players.values()).map(p => ({
          nickname: p.nickname,
          score: p.score
        }))
      });
    });

    // Hôte: démarrer la partie
    socket.on('host:start', ({ pin }) => {
      const game = activeGames.get(pin);
      if (!game || game.hostSocketId !== socket.id) {
        socket.emit('error', { message: 'Non autorisé' });
        return;
      }

      if (game.players.size === 0) {
        socket.emit('error', { message: 'Aucun joueur dans la partie' });
        return;
      }

      game.status = 'playing';
      io.to(`game:${pin}`).emit('game:started');

      // Envoyer la première question après un court délai
      setTimeout(() => {
        sendNextQuestion(io, pin);
      }, 3000);
    });

    // Joueur: soumettre une réponse
    socket.on('player:answer', ({ pin, answerIndex }) => {
      const game = activeGames.get(pin);
      if (!game) return;

      const player = game.players.get(socket.id);
      if (!player) return;

      const questionIndex = game.currentQuestionIndex;
      const question = game.quiz.questions[questionIndex];
      if (!question) return;

      // Vérifier si le joueur n'a pas déjà répondu
      if (game.answers.has(`${socket.id}-${questionIndex}`)) {
        return;
      }

      const answerTime = Date.now() - game.questionStartTime;
      const isCorrect = question.answers[answerIndex]?.isCorrect || false;

      // Calculer les points (plus rapide = plus de points)
      let points = 0;
      if (isCorrect) {
        const timeRatio = Math.max(0, 1 - (answerTime / (question.timeLimit * 1000)));
        points = Math.round(question.points * (0.5 + 0.5 * timeRatio));
        player.score += points;
        player.streak++;
      } else {
        player.streak = 0;
      }

      game.answers.set(`${socket.id}-${questionIndex}`, {
        answerIndex,
        isCorrect,
        points,
        time: answerTime
      });

      player.answers.push({
        questionIndex,
        answerIndex,
        isCorrect,
        points
      });

      // Confirmer au joueur
      socket.emit('player:answered', {
        isCorrect,
        points,
        totalScore: player.score
      });

      // Notifier l'hôte du nombre de réponses
      const answersCount = Array.from(game.answers.keys())
        .filter(k => k.endsWith(`-${questionIndex}`)).length;

      io.to(`host:${pin}`).emit('host:answerCount', {
        count: answersCount,
        total: game.players.size
      });
    });

    // Hôte: passer à la question suivante
    socket.on('host:nextQuestion', ({ pin }) => {
      const game = activeGames.get(pin);
      if (!game || game.hostSocketId !== socket.id) return;

      sendNextQuestion(io, pin);
    });

    // Hôte: afficher les résultats de la question
    socket.on('host:showResults', ({ pin }) => {
      const game = activeGames.get(pin);
      if (!game || game.hostSocketId !== socket.id) return;

      showQuestionResults(io, pin);
    });

    // Déconnexion
    socket.on('disconnect', () => {
      const pin = socket.data.pin;
      if (!pin) return;

      const game = activeGames.get(pin);
      if (!game) return;

      // Si c'est un joueur
      if (game.players.has(socket.id)) {
        const player = game.players.get(socket.id);
        game.players.delete(socket.id);

        io.to(`host:${pin}`).emit('player:left', {
          nickname: player.nickname,
          playerCount: game.players.size
        });
      }

      // Si c'est l'hôte
      if (game.hostSocketId === socket.id) {
        io.to(`game:${pin}`).emit('game:cancelled', {
          message: "L'hôte a quitté la partie"
        });
        activeGames.delete(pin);
      }
    });
  });
}

function sendNextQuestion(io, pin) {
  const game = activeGames.get(pin);
  if (!game) return;

  game.currentQuestionIndex++;
  const questionIndex = game.currentQuestionIndex;
  const question = game.quiz.questions[questionIndex];

  if (!question) {
    // Fin du quiz
    game.status = 'finished';
    endGame(io, pin);
    return;
  }

  game.questionStartTime = Date.now();

  // Envoyer la question aux joueurs (sans les réponses correctes)
  const playerQuestion = {
    index: questionIndex,
    total: game.quiz.questions.length,
    text: question.text,
    timeLimit: question.timeLimit,
    answers: question.answers.map((a, i) => ({
      index: i,
      text: a.text
    }))
  };

  // Envoyer à l'hôte (avec les réponses correctes)
  const hostQuestion = {
    ...playerQuestion,
    correctAnswers: question.answers
      .map((a, i) => a.isCorrect ? i : -1)
      .filter(i => i >= 0)
  };

  io.to(`host:${pin}`).emit('question:show', hostQuestion);
  io.to(`game:${pin}`).emit('question:start', playerQuestion);

  // Timer pour la fin de la question
  game.questionTimer = setTimeout(() => {
    showQuestionResults(io, pin);
  }, question.timeLimit * 1000);
}

function showQuestionResults(io, pin) {
  const game = activeGames.get(pin);
  if (!game) return;

  // Annuler le timer si encore actif
  if (game.questionTimer) {
    clearTimeout(game.questionTimer);
  }

  const questionIndex = game.currentQuestionIndex;
  const question = game.quiz.questions[questionIndex];

  // Calculer les statistiques des réponses
  const answerStats = question.answers.map((_, i) => ({
    index: i,
    count: 0
  }));

  game.answers.forEach((answer, key) => {
    if (key.endsWith(`-${questionIndex}`)) {
      if (answerStats[answer.answerIndex]) {
        answerStats[answer.answerIndex].count++;
      }
    }
  });

  // Classement actuel
  const leaderboard = Array.from(game.players.values())
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .map((p, i) => ({
      rank: i + 1,
      nickname: p.nickname,
      score: p.score
    }));

  io.to(`game:${pin}`).emit('question:results', {
    correctAnswers: question.answers
      .map((a, i) => a.isCorrect ? i : -1)
      .filter(i => i >= 0),
    answerStats,
    leaderboard,
    isLastQuestion: questionIndex === game.quiz.questions.length - 1
  });
}

function endGame(io, pin) {
  const game = activeGames.get(pin);
  if (!game) return;

  const finalLeaderboard = Array.from(game.players.values())
    .sort((a, b) => b.score - a.score)
    .map((p, i) => ({
      rank: i + 1,
      nickname: p.nickname,
      score: p.score
    }));

  // Podium (top 3)
  const podium = finalLeaderboard.slice(0, 3);

  io.to(`game:${pin}`).emit('game:ended', {
    podium,
    leaderboard: finalLeaderboard,
    quizTitle: game.quiz.title,
    totalQuestions: game.quiz.questions.length
  });

  // Mettre à jour les scores en base
  game.players.forEach(async (player) => {
    await prisma.player.update({
      where: { id: player.id },
      data: { score: player.score }
    }).catch(() => {});
  });

  // Mettre à jour le statut de la partie
  prisma.game.update({
    where: { id: game.id },
    data: { status: 'finished' }
  }).catch(() => {});
}

import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';
import { useSoundContext } from '../context/SoundContext';
import Confetti from '../components/Confetti';
import CircularTimer from '../components/CircularTimer';
import ParticleBackground from '../components/ParticleBackground';
import SoundToggle from '../components/SoundToggle';

const answerColors = ['bg-kahoot-red', 'bg-kahoot-blue', 'bg-kahoot-yellow', 'bg-kahoot-green'];
const answerShapes = ['triangle', 'diamond', 'circle', 'square'];

function PlayerGame() {
  const { pin } = useParams();
  const navigate = useNavigate();
  const { socket, isConnected } = useSocket();
  const { playCorrect, playWrong, playClick, playGameStart, playTimeWarning, playVictory, playStreak, playTick } = useSoundContext();
  const lastTimeRef = useRef(null);

  const [gameState, setGameState] = useState('nickname'); // nickname, waiting, question, answered, results, ended
  const [nickname, setNickname] = useState('');
  const [question, setQuestion] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [totalTime, setTotalTime] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [answerResult, setAnswerResult] = useState(null);
  const [score, setScore] = useState(0);
  const [results, setResults] = useState(null);
  const [finalResults, setFinalResults] = useState(null);
  const [myRank, setMyRank] = useState(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [streak, setStreak] = useState(0);
  const [animateAnswer, setAnimateAnswer] = useState(false);

  // Pour PUZZLE
  const [textAnswer, setTextAnswer] = useState('');

  // Pour DRAG_DROP
  const [orderedItems, setOrderedItems] = useState([]);
  const [draggedItem, setDraggedItem] = useState(null);

  useEffect(() => {
    if (!socket || !isConnected) return;

    socket.on('player:joined', ({ nickname, playerCount }) => {
      setGameState('waiting');
    });

    socket.on('game:started', () => {
      playGameStart();
      setGameState('waiting');
    });

    socket.on('question:start', (questionData) => {
      setQuestion(questionData);
      setTimeLeft(questionData.timeLimit);
      setTotalTime(questionData.timeLimit);
      setSelectedAnswer(null);
      setAnswerResult(null);
      setAnimateAnswer(false);
      setTextAnswer('');
      // Pour DRAG_DROP, initialiser avec les items m\u00e9lang\u00e9s
      if (questionData.type === 'DRAG_DROP') {
        setOrderedItems(questionData.answers.map(a => a.text));
      } else {
        setOrderedItems([]);
      }
      setGameState('question');
    });

    socket.on('player:answered', ({ isCorrect, points, totalScore, streak: newStreak, isSurvey }) => {
      setAnswerResult({ isCorrect, points, isSurvey });
      setScore(totalScore);
      const currentStreak = newStreak || (isCorrect ? streak + 1 : 0);
      setStreak(currentStreak);
      setAnimateAnswer(true);

      if (isSurvey) {
        // Pas de feedback pour les sondages
      } else if (isCorrect) {
        playCorrect();
        if (currentStreak >= 2) {
          setTimeout(() => playStreak(currentStreak), 300);
        }
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 3000);
      } else {
        playWrong();
      }

      setGameState('answered');
    });

    socket.on('question:results', (resultsData) => {
      setResults(resultsData);
      const rank = resultsData.leaderboard.find(p => p.nickname === nickname)?.rank;
      setMyRank(rank);
      setGameState('results');
    });

    socket.on('game:ended', (endData) => {
      setFinalResults(endData);
      const rank = endData.leaderboard.find(p => p.nickname === nickname)?.rank;
      setMyRank(rank);
      if (rank <= 3) {
        playVictory();
        setShowConfetti(true);
      }
      setGameState('ended');
    });

    socket.on('game:cancelled', ({ message }) => {
      alert(message);
      navigate('/');
    });

    socket.on('error', ({ message }) => {
      alert(message);
      if (gameState === 'nickname') {
        // Rester sur la page pour r\u00e9essayer
      } else {
        navigate('/');
      }
    });

    return () => {
      socket.off('player:joined');
      socket.off('game:started');
      socket.off('question:start');
      socket.off('player:answered');
      socket.off('question:results');
      socket.off('game:ended');
      socket.off('game:cancelled');
      socket.off('error');
    };
  }, [socket, isConnected, navigate, nickname, gameState, streak, playCorrect, playWrong, playGameStart, playVictory, playStreak]);

  useEffect(() => {
    if (gameState !== 'question' || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timer);
          return 0;
        }
        // Play warning sound at 5 seconds
        if (t === 6) {
          playTimeWarning();
        }
        // Play tick for last 5 seconds
        if (t <= 6 && t > 1) {
          playTick();
        }
        return t - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gameState, timeLeft, playTimeWarning, playTick]);

  const joinGame = (e) => {
    e.preventDefault();
    if (!nickname.trim()) {
      alert('Entrez un pseudo');
      return;
    }
    socket.emit('player:join', { pin, nickname: nickname.trim() });
  };

  const submitAnswer = (answerIndex) => {
    if (selectedAnswer !== null || timeLeft === 0) return;
    playClick();
    setSelectedAnswer(answerIndex);
    socket.emit('player:answer', { pin, answerIndex });
  };

  const submitTextAnswer = () => {
    if (selectedAnswer !== null || timeLeft === 0 || !textAnswer.trim()) return;
    playClick();
    setSelectedAnswer(-1); // Marqueur pour indiquer qu'on a r\u00e9pondu
    socket.emit('player:answer', { pin, textAnswer: textAnswer.trim() });
  };

  const submitOrderedAnswer = () => {
    if (selectedAnswer !== null || timeLeft === 0) return;
    playClick();
    setSelectedAnswer(-1);
    socket.emit('player:answer', { pin, orderedItems });
  };

  // Drag and drop handlers pour DRAG_DROP
  const handleDragStart = (e, index) => {
    setDraggedItem(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    if (draggedItem === null || draggedItem === index) return;

    const newItems = [...orderedItems];
    const draggedText = newItems[draggedItem];
    newItems.splice(draggedItem, 1);
    newItems.splice(index, 0, draggedText);

    setDraggedItem(index);
    setOrderedItems(newItems);
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
  };

  if (gameState === 'nickname') {
    return (
      <div className="min-h-screen bg-kahoot-purple flex items-center justify-center p-4 relative overflow-hidden">
        <SoundToggle className="absolute top-4 right-4 z-20" />
        <ParticleBackground />

        <div className="card w-full max-w-md animate-zoom-in relative z-10">
          <div className="text-center mb-6">
            <div className="w-20 h-20 bg-gradient-to-br from-kahoot-purple to-kahoot-blue rounded-full mx-auto mb-4 flex items-center justify-center animate-float">
              <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-kahoot-purple">
              Entrez votre pseudo
            </h1>
          </div>

          <form onSubmit={joinGame}>
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              className="input text-center text-xl mb-4 focus:ring-4 focus:ring-kahoot-purple/30"
              placeholder="Votre pseudo"
              maxLength={20}
              autoFocus
            />

            <button
              type="submit"
              disabled={!nickname.trim()}
              className="btn btn-success w-full text-xl py-4 ripple btn-glow"
            >
              Rejoindre
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (gameState === 'waiting') {
    return (
      <div className="min-h-screen bg-kahoot-purple flex items-center justify-center p-4 relative overflow-hidden">
        <ParticleBackground />

        <div className="text-center text-white relative z-10">
          <div className="animate-float">
            <div className="text-6xl font-black mb-4 animate-wiggle">{nickname}</div>
          </div>
          <p className="text-xl animate-fade-in" style={{ animationDelay: '0.3s' }}>
            Vous \u00eates dans la partie !
          </p>
          <p className="text-white/60 mt-2 animate-fade-in" style={{ animationDelay: '0.5s' }}>
            En attente du d\u00e9but...
          </p>

          <div className="mt-8 flex justify-center gap-3 waiting-dots">
            <span className="w-4 h-4 bg-white rounded-full"></span>
            <span className="w-4 h-4 bg-white rounded-full"></span>
            <span className="w-4 h-4 bg-white rounded-full"></span>
          </div>

          <div className="mt-8 glass-card p-4 inline-block animate-fade-in" style={{ animationDelay: '0.7s' }}>
            <p className="text-sm text-white/80">Pr\u00e9parez-vous \u00e0 jouer !</p>
          </div>
        </div>
      </div>
    );
  }

  if (gameState === 'answered') {
    // Sondage : affichage sp\u00e9cial
    if (answerResult?.isSurvey) {
      return (
        <div className="min-h-screen bg-kahoot-blue flex items-center justify-center p-4 relative overflow-hidden">
          <div className="text-center text-white relative z-10">
            <svg className="w-32 h-32 mx-auto mb-4 animate-zoom-in" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
            <h1 className="text-4xl font-black mb-2 animate-bounce-in">R\u00e9ponse enregistr\u00e9e !</h1>
            <p className="text-xl opacity-80">Merci pour votre participation</p>
            <div className="mt-6 glass-card p-4 inline-block animate-fade-in">
              <p className="text-sm opacity-80">Sondage - Pas de points</p>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className={`min-h-screen flex items-center justify-center p-4 relative overflow-hidden ${
        answerResult?.isCorrect ? 'bg-kahoot-green' : 'bg-kahoot-red'
      }`}>
        <Confetti active={showConfetti} />

        <div className={`text-center text-white relative z-10 ${
          animateAnswer ? (answerResult?.isCorrect ? 'animate-correct-pulse' : 'animate-wrong-shake') : ''
        }`}>
          {answerResult?.isCorrect ? (
            <>
              <div className="relative">
                <svg className="w-32 h-32 mx-auto mb-4 animate-zoom-in" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                {/* Glow effect */}
                <div className="absolute inset-0 w-32 h-32 mx-auto rounded-full bg-white/20 blur-xl animate-pulse" />
              </div>

              <h1 className="text-5xl font-black mb-2 animate-bounce-in">Correct !</h1>
              <p className="text-3xl font-bold animate-scale-in" style={{ animationDelay: '0.2s' }}>
                +{answerResult.points} points
              </p>

              {streak >= 2 && (
                <div className="mt-4 animate-streak-fire">
                  <span className="streak-badge bg-orange-500 px-4 py-2 rounded-full text-lg font-bold inline-flex items-center gap-2">
                    <span className="text-2xl">&#128293;</span>
                    S\u00e9rie de {streak} !
                  </span>
                </div>
              )}
            </>
          ) : (
            <>
              <svg className="w-32 h-32 mx-auto mb-4 animate-wrong-shake" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
              <h1 className="text-5xl font-black mb-2">Incorrect</h1>
              <p className="text-3xl">0 points</p>
            </>
          )}

          <div className="mt-6 glass-card p-4 inline-block animate-fade-in" style={{ animationDelay: '0.5s' }}>
            <p className="text-lg">Score total : <span className="font-bold text-2xl">{score}</span></p>
          </div>
        </div>
      </div>
    );
  }

  if (gameState === 'results') {
    return (
      <div className="min-h-screen bg-kahoot-purple flex items-center justify-center p-4 relative overflow-hidden">
        <ParticleBackground />

        <div className="text-center text-white relative z-10">
          <h1 className="text-3xl font-bold mb-6 animate-slide-down">Classement</h1>

          {myRank && (
            <div className="animate-zoom-in">
              <div className={`text-8xl font-black mb-2 ${
                myRank === 1 ? 'text-yellow-400 neon-text' :
                myRank === 2 ? 'text-gray-300' :
                myRank === 3 ? 'text-orange-400' : ''
              }`}>
                #{myRank}
              </div>
              <p className="text-3xl font-bold">{score} points</p>

              {myRank <= 3 && (
                <div className="mt-4 text-5xl animate-bounce">
                  {myRank === 1 ? '\ud83e\udd47' : myRank === 2 ? '\ud83e\udd48' : '\ud83e\udd49'}
                </div>
              )}
            </div>
          )}

          <div className="mt-8 glass-card p-4 animate-fade-in" style={{ animationDelay: '0.5s' }}>
            <p className="text-white/80">Question suivante...</p>
            <div className="flex justify-center gap-2 mt-2 waiting-dots">
              <span className="w-2 h-2 bg-white rounded-full"></span>
              <span className="w-2 h-2 bg-white rounded-full"></span>
              <span className="w-2 h-2 bg-white rounded-full"></span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (gameState === 'ended') {
    const myFinalRank = finalResults?.leaderboard.find(p => p.nickname === nickname);

    return (
      <div className="min-h-screen bg-kahoot-purple flex items-center justify-center p-4 relative overflow-hidden">
        <Confetti active={showConfetti} duration={5000} />
        <ParticleBackground />

        <div className="text-center text-white relative z-10">
          <h1 className="text-4xl font-bold mb-8 animate-slide-down">Partie termin\u00e9e !</h1>

          <div className="card text-gray-800 p-8 animate-zoom-in">
            {myFinalRank?.rank <= 3 ? (
              <div className="mb-6">
                <span className={`text-8xl ${myFinalRank.rank === 1 ? 'animate-crown-bounce inline-block' : 'animate-bounce inline-block'}`}>
                  {myFinalRank.rank === 1 ? '\ud83e\udd47' : myFinalRank.rank === 2 ? '\ud83e\udd48' : '\ud83e\udd49'}
                </span>
              </div>
            ) : (
              <div className="mb-4 text-6xl animate-wiggle">\ud83c\udfae</div>
            )}

            <p className="text-xl mb-2">Vous avez termin\u00e9</p>
            <p className={`text-6xl font-black mb-4 ${
              myFinalRank?.rank === 1 ? 'text-yellow-500' :
              myFinalRank?.rank === 2 ? 'text-gray-500' :
              myFinalRank?.rank === 3 ? 'text-orange-500' : 'text-kahoot-purple'
            }`}>
              #{myFinalRank?.rank || '?'}
            </p>
            <p className="text-3xl font-bold text-kahoot-purple">{score} points</p>

            {myFinalRank?.rank === 1 && (
              <div className="mt-4 bg-gradient-to-r from-yellow-400 to-yellow-600 text-white px-6 py-2 rounded-full inline-block animate-glow">
                Champion !
              </div>
            )}
          </div>

          <button
            onClick={() => navigate('/')}
            className="btn btn-primary mt-8 btn-glow ripple animate-fade-in"
            style={{ animationDelay: '0.5s' }}
          >
            Retour \u00e0 l'accueil
          </button>
        </div>
      </div>
    );
  }

  // Question state - render based on question type
  const questionType = question?.type || 'MULTIPLE_CHOICE';

  const renderQuestionUI = () => {
    switch (questionType) {
      case 'TRUE_FALSE':
        return (
          <div className="flex-1 grid grid-cols-2 gap-4 relative z-10">
            <button
              onClick={() => submitAnswer(0)}
              disabled={selectedAnswer !== null || timeLeft === 0}
              className={`answer-btn bg-kahoot-green ${
                selectedAnswer === 0 ? 'ring-4 ring-white scale-95' : ''
              } flex items-center justify-center gap-2 ripple relative overflow-hidden group text-3xl
              ${selectedAnswer === null && timeLeft > 0 ? 'hover:brightness-110' : ''}`}
            >
              <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-all duration-200" />
              Vrai
              {selectedAnswer === 0 && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                  <div className="w-8 h-8 border-4 border-white rounded-full border-t-transparent animate-spin" />
                </div>
              )}
            </button>
            <button
              onClick={() => submitAnswer(1)}
              disabled={selectedAnswer !== null || timeLeft === 0}
              className={`answer-btn bg-kahoot-red ${
                selectedAnswer === 1 ? 'ring-4 ring-white scale-95' : ''
              } flex items-center justify-center gap-2 ripple relative overflow-hidden group text-3xl
              ${selectedAnswer === null && timeLeft > 0 ? 'hover:brightness-110' : ''}`}
            >
              <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-all duration-200" />
              Faux
              {selectedAnswer === 1 && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                  <div className="w-8 h-8 border-4 border-white rounded-full border-t-transparent animate-spin" />
                </div>
              )}
            </button>
          </div>
        );

      case 'PUZZLE':
        return (
          <div className="flex-1 flex flex-col items-center justify-center relative z-10 px-4">
            <div className="w-full max-w-md">
              <input
                type="text"
                value={textAnswer}
                onChange={(e) => setTextAnswer(e.target.value)}
                disabled={selectedAnswer !== null || timeLeft === 0}
                className="w-full px-6 py-4 text-2xl text-center rounded-xl border-4 border-white/30 bg-white/10 text-white placeholder-white/50 focus:border-white focus:outline-none"
                placeholder="Tapez votre r\u00e9ponse..."
                autoFocus
                onKeyPress={(e) => e.key === 'Enter' && submitTextAnswer()}
              />
              <button
                onClick={submitTextAnswer}
                disabled={selectedAnswer !== null || timeLeft === 0 || !textAnswer.trim()}
                className="btn btn-success w-full mt-4 text-xl py-4 ripple btn-glow"
              >
                {selectedAnswer !== null ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-6 h-6 border-4 border-white rounded-full border-t-transparent animate-spin" />
                    Envoy\u00e9...
                  </span>
                ) : (
                  'Valider'
                )}
              </button>
            </div>
          </div>
        );

      case 'DRAG_DROP':
        return (
          <div className="flex-1 flex flex-col items-center justify-center relative z-10 px-4">
            <div className="w-full max-w-md space-y-3">
              <p className="text-white text-center mb-4">Glissez pour r\u00e9ordonner</p>
              {orderedItems.map((item, index) => (
                <div
                  key={index}
                  draggable={selectedAnswer === null && timeLeft > 0}
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragEnd={handleDragEnd}
                  className={`${answerColors[index % 4]} rounded-xl p-4 flex items-center gap-3 cursor-move transition-all ${
                    draggedItem === index ? 'opacity-50 scale-95' : ''
                  } ${selectedAnswer !== null ? 'opacity-70 cursor-not-allowed' : ''}`}
                >
                  <div className="text-white/70">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                    </svg>
                  </div>
                  <span className="text-white font-bold text-lg">{index + 1}.</span>
                  <span className="text-white font-bold text-xl flex-1">{item}</span>
                </div>
              ))}
              <button
                onClick={submitOrderedAnswer}
                disabled={selectedAnswer !== null || timeLeft === 0}
                className="btn btn-success w-full mt-4 text-xl py-4 ripple btn-glow"
              >
                {selectedAnswer !== null ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-6 h-6 border-4 border-white rounded-full border-t-transparent animate-spin" />
                    Envoy\u00e9...
                  </span>
                ) : (
                  'Valider l\'ordre'
                )}
              </button>
            </div>
          </div>
        );

      case 'SURVEY':
      case 'MULTIPLE_CHOICE':
      default:
        return (
          <div className="flex-1 grid grid-cols-2 gap-3 relative z-10">
            {question?.answers.map((answer, i) => (
              <button
                key={i}
                onClick={() => submitAnswer(i)}
                disabled={selectedAnswer !== null || timeLeft === 0}
                className={`answer-btn ${answerColors[i]} ${
                  selectedAnswer === i ? 'ring-4 ring-white scale-95' : ''
                } flex items-center justify-center gap-2 ripple relative overflow-hidden group
                ${selectedAnswer === null && timeLeft > 0 ? 'hover:brightness-110' : ''}`}
                style={{
                  animationDelay: `${i * 0.1}s`,
                }}
              >
                {/* Hover effect */}
                <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-all duration-200" />

                <Shape type={answerShapes[i]} />

                {/* Selection indicator */}
                {selectedAnswer === i && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                    <div className="w-8 h-8 border-4 border-white rounded-full border-t-transparent animate-spin" />
                  </div>
                )}
              </button>
            ))}
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-kahoot-dark p-4 flex flex-col relative overflow-hidden">
      <SoundToggle className="absolute top-4 right-4 z-20" />

      {/* Animated background gradient */}
      <div
        className="absolute inset-0 opacity-30"
        style={{
          background: `radial-gradient(circle at 50% 50%, ${
            timeLeft <= 5 ? '#e21b3c' : '#46178f'
          } 0%, transparent 50%)`,
          transition: 'background 0.5s ease',
        }}
      />

      <div className="text-center mb-4 relative z-10">
        <CircularTimer timeLeft={timeLeft} totalTime={totalTime} size={100} />

        {/* Question type badge */}
        <div className="mt-2">
          <span className="bg-white/20 text-white px-3 py-1 rounded-full text-sm font-medium">
            {questionType === 'TRUE_FALSE' && 'Vrai / Faux'}
            {questionType === 'SURVEY' && 'Sondage'}
            {questionType === 'PUZZLE' && 'Puzzle'}
            {questionType === 'DRAG_DROP' && 'Glisser-d\u00e9poser'}
            {questionType === 'MULTIPLE_CHOICE' && 'Choix multiple'}
          </span>
        </div>

        {/* Progress bar */}
        <div className="mt-4 progress-bar max-w-xs mx-auto">
          <div
            className={`progress-bar-fill ${timeLeft <= 5 ? 'bg-kahoot-red' : 'bg-kahoot-purple'}`}
            style={{ width: `${(timeLeft / totalTime) * 100}%` }}
          />
        </div>
      </div>

      {renderQuestionUI()}

      {timeLeft === 0 && selectedAnswer === null && (
        <div className="text-center mt-4 text-white relative z-10 animate-fade-in">
          <p className="text-2xl font-bold animate-pulse">Temps \u00e9coul\u00e9 !</p>
        </div>
      )}
    </div>
  );
}

function Shape({ type }) {
  const className = "w-12 h-12 text-white drop-shadow-lg";

  switch (type) {
    case 'triangle':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2L2 22h20L12 2z" />
        </svg>
      );
    case 'diamond':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2L2 12l10 10 10-10L12 2z" />
        </svg>
      );
    case 'circle':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor">
          <circle cx="12" cy="12" r="10" />
        </svg>
      );
    case 'square':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor">
          <rect x="3" y="3" width="18" height="18" />
        </svg>
      );
    default:
      return null;
  }
}

export default PlayerGame;

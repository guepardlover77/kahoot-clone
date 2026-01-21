import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';
import { useSoundContext } from '../context/SoundContext';
import Confetti from '../components/Confetti';
import CircularTimer from '../components/CircularTimer';
import ParticleBackground from '../components/ParticleBackground';
import SoundToggle from '../components/SoundToggle';

const answerColors = ['bg-kahoot-red', 'bg-kahoot-blue', 'bg-kahoot-yellow', 'bg-kahoot-green'];
const answerShapes = ['triangle', 'diamond', 'circle', 'square'];

const questionTypeLabels = {
  MULTIPLE_CHOICE: 'Choix multiple',
  TRUE_FALSE: 'Vrai / Faux',
  SURVEY: 'Sondage',
  PUZZLE: 'Puzzle',
  DRAG_DROP: 'Glisser-d\u00e9poser'
};

function HostGame() {
  const { pin } = useParams();
  const navigate = useNavigate();
  const { socket } = useSocket();
  const { playCountdown, playGameStart, playTimeWarning, playVictory, playTick, playClick } = useSoundContext();

  const [gameState, setGameState] = useState('starting'); // starting, question, results, ended
  const [question, setQuestion] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [totalTime, setTotalTime] = useState(0);
  const [answerCount, setAnswerCount] = useState({ count: 0, total: 0 });
  const [results, setResults] = useState(null);
  const [finalResults, setFinalResults] = useState(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [countdownNumber, setCountdownNumber] = useState(3);

  useEffect(() => {
    if (!socket) return;

    socket.on('question:show', (questionData) => {
      setQuestion(questionData);
      setTimeLeft(questionData.timeLimit);
      setTotalTime(questionData.timeLimit);
      setAnswerCount({ count: 0, total: 0 });
      playGameStart();
      setGameState('question');
    });

    socket.on('host:answerCount', ({ count, total }) => {
      setAnswerCount({ count, total });
    });

    socket.on('question:results', (resultsData) => {
      setResults(resultsData);
      setGameState('results');
    });

    socket.on('game:ended', (endData) => {
      setFinalResults(endData);
      playVictory();
      setShowConfetti(true);
      setGameState('ended');
    });

    socket.on('game:cancelled', () => {
      navigate('/');
    });

    return () => {
      socket.off('question:show');
      socket.off('host:answerCount');
      socket.off('question:results');
      socket.off('game:ended');
      socket.off('game:cancelled');
    };
  }, [socket, navigate, playGameStart, playVictory]);

  useEffect(() => {
    if (gameState !== 'question' || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timer);
          return 0;
        }
        // Play warning at 5 seconds
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

  // Countdown animation when starting
  useEffect(() => {
    if (gameState !== 'starting') return;

    // Play initial countdown sound
    playCountdown();

    const interval = setInterval(() => {
      setCountdownNumber((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          playGameStart();
          return 0;
        }
        playCountdown();
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [gameState, playCountdown, playGameStart]);

  const nextQuestion = () => {
    playClick();
    socket.emit('host:nextQuestion', { pin });
  };

  const showResults = () => {
    playClick();
    socket.emit('host:showResults', { pin });
  };

  const goHome = () => {
    playClick();
    navigate('/');
  };

  const questionType = question?.type || 'MULTIPLE_CHOICE';

  if (gameState === 'starting') {
    return (
      <div className="min-h-screen bg-kahoot-purple flex items-center justify-center relative overflow-hidden">
        <SoundToggle className="absolute top-4 right-4 z-20" />
        <ParticleBackground />

        <div className="text-center relative z-10">
          <h1 className="text-4xl font-bold text-white mb-8 animate-fade-in">La partie commence !</h1>

          <div className="relative w-40 h-40 mx-auto">
            <div className="absolute inset-0 bg-white/10 rounded-full animate-ping" />
            <div className="absolute inset-4 bg-white/20 rounded-full animate-pulse" />
            <div className="absolute inset-0 flex items-center justify-center">
              <span
                className="text-8xl font-black text-white animate-countdown"
                key={countdownNumber}
              >
                {countdownNumber > 0 ? countdownNumber : '\ud83d\ude80'}
              </span>
            </div>
          </div>

          <p className="text-white/60 mt-8 animate-pulse">Pr\u00e9parez-vous !</p>
        </div>
      </div>
    );
  }

  if (gameState === 'ended') {
    return (
      <div className="min-h-screen bg-kahoot-purple p-4 relative overflow-hidden">
        <SoundToggle className="absolute top-4 right-4 z-20" />
        <Confetti active={showConfetti} duration={8000} />
        <ParticleBackground />

        <div className="max-w-3xl mx-auto text-center relative z-10">
          <h1 className="text-5xl font-bold text-white mb-8 animate-slide-down">
            Partie termin\u00e9e !
          </h1>

          <div className="card mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-8">Podium</h2>

            {/* Podium */}
            <div className="flex justify-center items-end gap-4 mb-8 h-64">
              {/* 2nd place */}
              {finalResults?.podium[1] && (
                <div
                  className="text-center animate-podium-rise w-28"
                  style={{ animationDelay: '0.3s' }}
                >
                  <div className="mb-2 animate-bounce-in" style={{ animationDelay: '0.6s' }}>
                    <span className="text-5xl">\ud83e\udd48</span>
                  </div>
                  <div className="podium-2 h-24 rounded-t-xl flex flex-col items-center justify-center p-2">
                    <span className="text-4xl font-black text-gray-700">2</span>
                  </div>
                  <div className="bg-gray-100 p-3 rounded-b-lg">
                    <p className="font-bold text-gray-800 truncate">{finalResults.podium[1].nickname}</p>
                    <p className="text-sm text-gray-500">{finalResults.podium[1].score} pts</p>
                  </div>
                </div>
              )}

              {/* 1st place */}
              {finalResults?.podium[0] && (
                <div
                  className="text-center animate-podium-rise w-32"
                  style={{ animationDelay: '0.1s' }}
                >
                  <div className="mb-2 animate-crown-bounce">
                    <span className="text-6xl">\ud83d\udc51</span>
                  </div>
                  <div className="mb-2 animate-bounce-in" style={{ animationDelay: '0.4s' }}>
                    <span className="text-6xl">\ud83e\udd47</span>
                  </div>
                  <div className="podium-1 h-32 rounded-t-xl flex flex-col items-center justify-center p-2 relative">
                    <div className="absolute inset-0 rounded-t-xl bg-gradient-to-t from-yellow-600/20 to-transparent" />
                    <span className="text-5xl font-black text-yellow-800 relative z-10">1</span>
                  </div>
                  <div className="bg-yellow-50 p-3 rounded-b-lg border-2 border-yellow-200">
                    <p className="font-bold text-gray-800 truncate text-lg">{finalResults.podium[0].nickname}</p>
                    <p className="text-sm text-yellow-700 font-semibold">{finalResults.podium[0].score} pts</p>
                  </div>
                </div>
              )}

              {/* 3rd place */}
              {finalResults?.podium[2] && (
                <div
                  className="text-center animate-podium-rise w-24"
                  style={{ animationDelay: '0.5s' }}
                >
                  <div className="mb-2 animate-bounce-in" style={{ animationDelay: '0.8s' }}>
                    <span className="text-4xl">\ud83e\udd49</span>
                  </div>
                  <div className="podium-3 h-16 rounded-t-xl flex flex-col items-center justify-center p-2">
                    <span className="text-3xl font-black text-orange-800">3</span>
                  </div>
                  <div className="bg-orange-50 p-3 rounded-b-lg">
                    <p className="font-bold text-gray-800 truncate">{finalResults.podium[2].nickname}</p>
                    <p className="text-sm text-gray-500">{finalResults.podium[2].score} pts</p>
                  </div>
                </div>
              )}
            </div>

            {/* Full leaderboard */}
            <h3 className="text-lg font-bold text-gray-700 mb-4">Classement complet</h3>
            <div className="space-y-2 max-h-60 overflow-y-auto px-2">
              {finalResults?.leaderboard.map((player, index) => (
                <div
                  key={player.rank}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg animate-slide-up hover:bg-gray-100 transition-colors"
                  style={{ animationDelay: `${0.8 + index * 0.1}s` }}
                >
                  <div className="flex items-center gap-3">
                    <span className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white shadow-md ${
                      player.rank === 1 ? 'bg-gradient-to-br from-yellow-400 to-yellow-600' :
                      player.rank === 2 ? 'bg-gradient-to-br from-gray-300 to-gray-500' :
                      player.rank === 3 ? 'bg-gradient-to-br from-orange-400 to-orange-600' :
                      'bg-gradient-to-br from-kahoot-purple to-purple-700'
                    }`}>
                      {player.rank <= 3 ? (
                        <span className="text-lg">{player.rank === 1 ? '\ud83e\udd47' : player.rank === 2 ? '\ud83e\udd48' : '\ud83e\udd49'}</span>
                      ) : (
                        player.rank
                      )}
                    </span>
                    <span className="font-bold text-gray-800">{player.nickname}</span>
                  </div>
                  <span className="text-gray-600 font-semibold">{player.score} pts</span>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={goHome}
            className="btn btn-primary btn-glow ripple text-lg px-8 animate-fade-in"
            style={{ animationDelay: '1.5s' }}
          >
            Retour \u00e0 l'accueil
          </button>
        </div>
      </div>
    );
  }

  if (gameState === 'results') {
    const resultsType = results?.type || 'MULTIPLE_CHOICE';

    return (
      <div className="min-h-screen bg-kahoot-purple p-4 relative overflow-hidden">
        <SoundToggle className="absolute top-4 right-4 z-20" />
        <ParticleBackground />

        <div className="max-w-4xl mx-auto relative z-10">
          <div className="text-center mb-6">
            <div className="flex items-center justify-center gap-3 mb-2">
              <p className="text-white/60 animate-fade-in">Question {question?.index + 1} / {question?.total}</p>
              <span className="bg-white/20 text-white px-3 py-1 rounded-full text-sm font-medium">
                {questionTypeLabels[resultsType]}
              </span>
            </div>
            <h2 className="text-3xl font-bold text-white mt-2 animate-slide-down">{question?.text}</h2>
          </div>

          {/* R\u00e9sultats selon le type */}
          {(resultsType === 'MULTIPLE_CHOICE' || resultsType === 'TRUE_FALSE' || resultsType === 'SURVEY') && (
            <div className={`grid ${resultsType === 'TRUE_FALSE' ? 'grid-cols-2' : 'grid-cols-2'} gap-4 mb-8`}>
              {question?.answers.map((answer, i) => {
                const isCorrect = results?.correctAnswers?.includes(i);
                const isSurvey = resultsType === 'SURVEY';
                const stat = results?.answerStats?.find(s => s.index === i);
                const percentage = answerCount.count > 0
                  ? Math.round((stat?.count || 0) / answerCount.count * 100)
                  : 0;

                return (
                  <div
                    key={i}
                    className={`${answerColors[i % 4]} ${!isSurvey && !isCorrect ? 'opacity-50 scale-95' : ''} ${!isSurvey && isCorrect ? 'animate-correct-pulse' : ''}
                      rounded-xl p-4 relative transition-all duration-500 animate-fade-in`}
                    style={{ animationDelay: `${i * 0.1}s` }}
                  >
                    <div className="flex items-center gap-3">
                      <Shape type={answerShapes[i % 4]} />
                      <span className="text-white font-bold text-lg flex-1">{answer.text}</span>
                      {!isSurvey && isCorrect && (
                        <div className="animate-bounce-in">
                          <svg className="w-8 h-8 text-white drop-shadow-lg" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                    </div>

                    {/* Answer bar */}
                    <div className="mt-3">
                      <div className="flex justify-between text-white/80 text-sm mb-1">
                        <span>{stat?.count || 0} r\u00e9ponse{(stat?.count || 0) > 1 ? 's' : ''}</span>
                        <span>{percentage}%</span>
                      </div>
                      <div className="h-2 bg-black/20 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-white/50 rounded-full transition-all duration-1000"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* R\u00e9sultats PUZZLE */}
          {resultsType === 'PUZZLE' && (
            <div className="mb-8">
              <div className="card p-6 animate-zoom-in">
                <h3 className="text-xl font-bold text-gray-800 mb-4">R\u00e9ponse correcte</h3>
                <div className="bg-kahoot-green/20 border-2 border-kahoot-green rounded-xl p-4 mb-4">
                  <p className="text-2xl font-bold text-kahoot-green text-center">{results?.correctAnswer}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {results?.answerStats?.map((stat, i) => (
                    <div
                      key={i}
                      className={`p-4 rounded-xl ${i === 0 ? 'bg-kahoot-green/20' : 'bg-kahoot-red/20'}`}
                    >
                      <p className="text-lg font-bold text-gray-800">{stat.text}</p>
                      <p className="text-3xl font-black text-gray-800">{stat.count}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* R\u00e9sultats DRAG_DROP */}
          {resultsType === 'DRAG_DROP' && (
            <div className="mb-8">
              <div className="card p-6 animate-zoom-in">
                <h3 className="text-xl font-bold text-gray-800 mb-4">Ordre correct</h3>
                <div className="space-y-2 mb-4">
                  {question?.answers?.map((answer, i) => (
                    <div key={i} className={`${answerColors[i % 4]} rounded-lg p-3 flex items-center gap-3`}>
                      <span className="text-white font-bold w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                        {i + 1}
                      </span>
                      <span className="text-white font-bold">{answer.text}</span>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {results?.answerStats?.map((stat, i) => (
                    <div
                      key={i}
                      className={`p-4 rounded-xl ${i === 0 ? 'bg-kahoot-green/20' : 'bg-kahoot-red/20'}`}
                    >
                      <p className="text-lg font-bold text-gray-800">{stat.text}</p>
                      <p className="text-3xl font-black text-gray-800">{stat.count}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Note pour les sondages */}
          {resultsType === 'SURVEY' && (
            <div className="text-center text-white/60 mb-4 animate-fade-in">
              <p>Sondage - Pas de bonne r\u00e9ponse</p>
            </div>
          )}

          {/* Leaderboard */}
          <div className="card animate-slide-up" style={{ animationDelay: '0.4s' }}>
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <svg className="w-6 h-6 text-kahoot-purple" fill="currentColor" viewBox="0 0 24 24">
                <path d="M7.5 21H2V9h5.5v12zm7.25-18h-5.5v18h5.5V3zM22 11h-5.5v10H22V11z"/>
              </svg>
              Classement
            </h3>
            <div className="space-y-2">
              {results?.leaderboard.map((player, index) => (
                <div
                  key={player.rank}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg animate-slide-up hover:bg-gray-100 transition-colors"
                  style={{ animationDelay: `${0.5 + index * 0.1}s` }}
                >
                  <div className="flex items-center gap-3">
                    <span className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white shadow-md ${
                      player.rank === 1 ? 'bg-gradient-to-br from-yellow-400 to-yellow-600' :
                      player.rank === 2 ? 'bg-gradient-to-br from-gray-300 to-gray-500' :
                      player.rank === 3 ? 'bg-gradient-to-br from-orange-400 to-orange-600' :
                      'bg-gradient-to-br from-kahoot-purple to-purple-700'
                    }`}>
                      {player.rank}
                    </span>
                    <span className="font-bold text-gray-800">{player.nickname}</span>
                  </div>
                  <span className="text-gray-600 font-bold">{player.score} pts</span>
                </div>
              ))}
            </div>
          </div>

          <div className="text-center mt-6">
            <button
              onClick={nextQuestion}
              className="btn btn-success text-xl px-12 btn-glow ripple animate-fade-in"
              style={{ animationDelay: '0.8s' }}
            >
              {results?.isLastQuestion ? 'Voir les r\u00e9sultats finaux' : 'Question suivante'}
              <svg className="w-6 h-6 ml-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Question state
  return (
    <div className="min-h-screen bg-kahoot-dark p-4 relative overflow-hidden">
      <SoundToggle className="absolute top-4 right-4 z-20" />

      {/* Animated background */}
      <div
        className="absolute inset-0 opacity-20"
        style={{
          background: `radial-gradient(circle at 50% 30%, ${
            timeLeft <= 5 ? '#e21b3c' : '#46178f'
          } 0%, transparent 50%)`,
          transition: 'background 0.5s ease',
        }}
      />

      <div className="max-w-4xl mx-auto relative z-10">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-3">
            <span className="text-white/60 bg-white/10 px-4 py-2 rounded-full animate-fade-in">
              Question {question?.index + 1} / {question?.total}
            </span>
            <span className="bg-kahoot-purple/50 text-white px-3 py-2 rounded-full text-sm font-medium animate-fade-in">
              {questionTypeLabels[questionType]}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <div className="bg-white/10 px-4 py-2 rounded-full animate-fade-in" style={{ animationDelay: '0.1s' }}>
              <span className="text-white flex items-center gap-2">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
                </svg>
                {answerCount.count} / {answerCount.total}
              </span>
            </div>
          </div>
        </div>

        {/* Timer and question */}
        <div className="text-center mb-8">
          <div className="mb-6">
            <CircularTimer timeLeft={timeLeft} totalTime={totalTime} size={140} strokeWidth={10} />
          </div>

          <h2 className="text-4xl font-bold text-white animate-zoom-in">{question?.text}</h2>

          {/* Progress indicator */}
          <div className="mt-4 max-w-md mx-auto">
            <div className="flex justify-between text-white/60 text-sm mb-2">
              <span>R\u00e9ponses</span>
              <span>{Math.round((answerCount.count / Math.max(answerCount.total, 1)) * 100)}%</span>
            </div>
            <div className="progress-bar">
              <div
                className="progress-bar-fill bg-kahoot-green"
                style={{ width: `${(answerCount.count / Math.max(answerCount.total, 1)) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Affichage selon le type */}
        {(questionType === 'MULTIPLE_CHOICE' || questionType === 'SURVEY') && (
          <div className="grid grid-cols-2 gap-4 mb-8">
            {question?.answers.map((answer, i) => (
              <div
                key={i}
                className={`${answerColors[i]} rounded-xl p-6 flex items-center gap-4 animate-scale-in shadow-lg
                  hover:brightness-110 transition-all duration-200`}
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                <Shape type={answerShapes[i]} />
                <span className="text-white font-bold text-xl">{answer.text}</span>
              </div>
            ))}
          </div>
        )}

        {questionType === 'TRUE_FALSE' && (
          <div className="grid grid-cols-2 gap-6 mb-8">
            <div className="bg-kahoot-green rounded-xl p-8 flex items-center justify-center animate-scale-in shadow-lg">
              <span className="text-white font-bold text-3xl">Vrai</span>
            </div>
            <div className="bg-kahoot-red rounded-xl p-8 flex items-center justify-center animate-scale-in shadow-lg" style={{ animationDelay: '0.1s' }}>
              <span className="text-white font-bold text-3xl">Faux</span>
            </div>
          </div>
        )}

        {questionType === 'PUZZLE' && (
          <div className="mb-8">
            <div className="glass-card p-8 text-center animate-zoom-in">
              <div className="text-6xl mb-4">\ud83e\udde9</div>
              <p className="text-white text-xl">Les joueurs tapent leur r\u00e9ponse...</p>
              <p className="text-white/60 mt-2">R\u00e9ponse attendue : {question?.correctAnswer}</p>
            </div>
          </div>
        )}

        {questionType === 'DRAG_DROP' && (
          <div className="mb-8">
            <div className="glass-card p-6 animate-zoom-in">
              <p className="text-white text-center mb-4">Ordre correct :</p>
              <div className="space-y-2">
                {question?.answers.map((answer, i) => (
                  <div key={i} className={`${answerColors[i % 4]} rounded-lg p-3 flex items-center gap-3`}>
                    <span className="text-white font-bold w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                      {i + 1}
                    </span>
                    <span className="text-white font-bold">{answer.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Show results button */}
        {timeLeft === 0 && (
          <div className="text-center animate-bounce-in">
            <button
              onClick={showResults}
              className="btn btn-primary text-xl px-12 btn-glow ripple"
            >
              Afficher les r\u00e9sultats
              <svg className="w-6 h-6 ml-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function Shape({ type }) {
  const className = "w-10 h-10 text-white/80 drop-shadow-md";

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

export default HostGame;

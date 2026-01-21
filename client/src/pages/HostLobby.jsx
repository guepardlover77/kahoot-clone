import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';
import { useSoundContext } from '../context/SoundContext';
import ParticleBackground from '../components/ParticleBackground';
import SoundToggle from '../components/SoundToggle';

const playerColors = [
  'from-pink-500 to-rose-500',
  'from-purple-500 to-indigo-500',
  'from-blue-500 to-cyan-500',
  'from-green-500 to-emerald-500',
  'from-yellow-500 to-orange-500',
  'from-red-500 to-pink-500',
  'from-indigo-500 to-purple-500',
  'from-teal-500 to-green-500',
];

function HostLobby() {
  const { pin } = useParams();
  const navigate = useNavigate();
  const { socket, isConnected } = useSocket();
  const { playPlayerJoin, playClick } = useSoundContext();
  const [players, setPlayers] = useState([]);
  const [quizTitle, setQuizTitle] = useState('');
  const [questionCount, setQuestionCount] = useState(0);
  const [newPlayer, setNewPlayer] = useState(null);

  useEffect(() => {
    if (!socket || !isConnected) return;

    socket.emit('host:join', { pin });

    socket.on('host:joined', ({ quizTitle, questionCount }) => {
      setQuizTitle(quizTitle);
      setQuestionCount(questionCount);
    });

    socket.on('player:new', ({ players: newPlayers }) => {
      // Find the new player
      const lastPlayer = newPlayers[newPlayers.length - 1];
      setNewPlayer(lastPlayer?.nickname);
      setPlayers(newPlayers);
      playPlayerJoin();

      // Clear the new player highlight after animation
      setTimeout(() => setNewPlayer(null), 2000);
    });

    socket.on('player:left', ({ nickname, playerCount }) => {
      setPlayers(prev => prev.filter(p => p.nickname !== nickname));
    });

    socket.on('error', ({ message }) => {
      alert(message);
      navigate('/');
    });

    return () => {
      socket.off('host:joined');
      socket.off('player:new');
      socket.off('player:left');
      socket.off('error');
    };
  }, [socket, isConnected, pin, navigate, playPlayerJoin]);

  const startGame = () => {
    if (players.length === 0) {
      alert('En attente de joueurs...');
      return;
    }
    playClick();
    socket.emit('host:start', { pin });
    navigate(`/host/${pin}/game`);
  };

  return (
    <div className="min-h-screen bg-kahoot-purple p-4 relative overflow-hidden">
      <ParticleBackground />
      <SoundToggle className="absolute top-4 right-4 z-20" />

      <Link
        to="/"
        className="absolute top-4 left-4 text-white hover:text-purple-200 flex items-center gap-2 z-10 transition-all duration-200 hover:scale-105"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Quitter
      </Link>

      <div className="max-w-4xl mx-auto text-center relative z-10">
        {/* Join instructions */}
        <div className="mb-8 animate-fade-in">
          <p className="text-white/60 mb-2">Rejoignez sur</p>
          <p className="text-2xl text-white font-bold mb-4 animate-pulse">
            {window.location.origin}/join
          </p>

          {/* PIN Display */}
          <div className="gradient-border rounded-2xl inline-block">
            <div className="bg-white rounded-2xl p-8">
              <p className="text-gray-500 mb-2">Code PIN de la partie</p>
              <p className="text-7xl font-black text-kahoot-purple tracking-wider animate-bounce-in">
                {pin?.split('').map((digit, i) => (
                  <span
                    key={i}
                    className="inline-block animate-bounce-in"
                    style={{ animationDelay: `${i * 0.1}s` }}
                  >
                    {digit}
                  </span>
                ))}
              </p>
            </div>
          </div>
        </div>

        {/* Quiz info */}
        <div className="card mb-6 animate-slide-up" style={{ animationDelay: '0.2s' }}>
          <div className="flex items-center justify-center gap-3 mb-2">
            <div className="w-10 h-10 bg-kahoot-purple rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-800">{quizTitle}</h2>
          </div>
          <p className="text-gray-500 flex items-center justify-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {questionCount} questions
          </p>
        </div>

        {/* Players section */}
        <div className="card animate-slide-up" style={{ animationDelay: '0.3s' }}>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="relative">
                <svg className="w-8 h-8 text-kahoot-purple" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
                </svg>
                {players.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-kahoot-green text-white text-xs font-bold rounded-full flex items-center justify-center animate-pop">
                    {players.length}
                  </span>
                )}
              </div>
              <h3 className="text-lg font-bold text-gray-800">
                Joueurs
              </h3>
            </div>

            {players.length > 0 && (
              <button
                onClick={startGame}
                className="btn btn-success btn-glow ripple flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Commencer
              </button>
            )}
          </div>

          {players.length === 0 ? (
            <div className="py-12 text-center">
              <div className="w-24 h-24 mx-auto mb-6 relative">
                <div className="absolute inset-0 bg-kahoot-purple/20 rounded-full animate-ping" />
                <div className="absolute inset-2 bg-kahoot-purple/30 rounded-full animate-pulse" />
                <div className="absolute inset-4 bg-kahoot-purple/40 rounded-full flex items-center justify-center">
                  <svg className="w-10 h-10 text-kahoot-purple animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
              </div>
              <p className="text-gray-500 text-lg">En attente de joueurs...</p>
              <p className="text-gray-400 text-sm mt-2">
                Partagez le code PIN pour que les joueurs rejoignent
              </p>
            </div>
          ) : (
            <div className="flex flex-wrap gap-3 justify-center">
              {players.map((player, i) => (
                <div
                  key={player.nickname}
                  className={`relative bg-gradient-to-r ${playerColors[i % playerColors.length]} text-white px-5 py-3 rounded-full font-bold shadow-lg
                    ${newPlayer === player.nickname ? 'animate-zoom-in' : 'animate-bounce-in'}
                    hover:scale-105 transition-transform duration-200`}
                  style={{
                    animationDelay: newPlayer === player.nickname ? '0s' : `${i * 0.05}s`,
                  }}
                >
                  {/* Glow effect for new player */}
                  {newPlayer === player.nickname && (
                    <div className="absolute inset-0 rounded-full bg-white/30 animate-ping" />
                  )}

                  <span className="relative z-10 flex items-center gap-2">
                    {/* Avatar circle */}
                    <span className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center text-sm">
                      {player.nickname.charAt(0).toUpperCase()}
                    </span>
                    {player.nickname}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Player count indicator */}
          {players.length > 0 && (
            <div className="mt-6 pt-4 border-t border-gray-100">
              <div className="flex items-center justify-center gap-2 text-gray-500">
                <div className="flex -space-x-2">
                  {players.slice(0, 5).map((player, i) => (
                    <div
                      key={player.nickname}
                      className={`w-8 h-8 rounded-full bg-gradient-to-r ${playerColors[i % playerColors.length]} border-2 border-white flex items-center justify-center text-white text-xs font-bold`}
                      style={{ zIndex: 5 - i }}
                    >
                      {player.nickname.charAt(0).toUpperCase()}
                    </div>
                  ))}
                  {players.length > 5 && (
                    <div className="w-8 h-8 rounded-full bg-gray-300 border-2 border-white flex items-center justify-center text-gray-600 text-xs font-bold">
                      +{players.length - 5}
                    </div>
                  )}
                </div>
                <span className="text-sm">
                  {players.length} joueur{players.length > 1 ? 's' : ''} connecté{players.length > 1 ? 's' : ''}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Tips */}
        {players.length > 0 && players.length < 3 && (
          <div className="mt-4 glass-card p-4 text-white/80 text-sm animate-fade-in">
            <span className="text-yellow-300">💡</span> Plus il y a de joueurs, plus c'est amusant !
          </div>
        )}
      </div>
    </div>
  );
}

export default HostLobby;

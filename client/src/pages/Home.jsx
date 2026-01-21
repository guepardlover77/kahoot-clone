import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import ParticleBackground from '../components/ParticleBackground';
import SoundToggle from '../components/SoundToggle';
import UserMenu from '../components/UserMenu';
import { useSoundContext } from '../context/SoundContext';
import { useAuth } from '../context/AuthContext';

function Home() {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { playClick } = useSoundContext();
  const { isAuthenticated, loading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading) {
      fetchQuizzes();
    }
  }, [authLoading, isAuthenticated]);

  const fetchQuizzes = async () => {
    try {
      const res = await fetch('/api/quiz', {
        credentials: 'include'
      });
      const data = await res.json();
      setQuizzes(data);
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  const startGame = async (quizId) => {
    playClick();
    try {
      const res = await fetch('/api/game/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ quizId })
      });
      const data = await res.json();
      if (data.pin) {
        navigate(`/host/${data.pin}`);
      }
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de la création de la partie');
    }
  };

  const deleteQuiz = async (id) => {
    if (!confirm('Supprimer ce quiz ?')) return;
    playClick();
    try {
      await fetch(`/api/quiz/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      fetchQuizzes();
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  return (
    <div className="min-h-screen bg-kahoot-purple p-4 relative overflow-hidden">
      <ParticleBackground />
      <div className="absolute top-4 right-4 z-20 flex items-center gap-3">
        <SoundToggle />
        <UserMenu />
      </div>

      <div className="max-w-4xl mx-auto relative z-10">
        <header className="text-center py-8 animate-fade-in">
          <div className="inline-block mb-4">
            <div className="w-20 h-20 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-float">
              <span className="text-4xl">🎯</span>
            </div>
          </div>
          <h1 className="text-5xl font-black text-white mb-2 animate-slide-down">Kahoot Clone</h1>
          <p className="text-purple-200 text-lg animate-fade-in" style={{ animationDelay: '0.2s' }}>
            Quiz interactif en temps réel
          </p>
        </header>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <Link
            to={isAuthenticated ? "/create" : "/login"}
            onClick={() => playClick()}
            className="card hover:shadow-3xl transition-all duration-300 flex flex-col items-center justify-center py-8 animate-scale-in group hover:scale-105"
            style={{ animationDelay: '0.1s' }}
          >
            <div className="w-16 h-16 bg-kahoot-green rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <span className="text-xl font-bold text-gray-800">Créer un quiz</span>
            <span className="text-gray-500 text-sm mt-1">
              {isAuthenticated ? 'Concevez vos propres questions' : 'Connectez-vous pour creer'}
            </span>
          </Link>

          <Link
            to="/join"
            onClick={() => playClick()}
            className="card hover:shadow-3xl transition-all duration-300 flex flex-col items-center justify-center py-8 animate-scale-in group hover:scale-105"
            style={{ animationDelay: '0.2s' }}
          >
            <div className="w-16 h-16 bg-kahoot-blue rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <span className="text-xl font-bold text-gray-800">Rejoindre une partie</span>
            <span className="text-gray-500 text-sm mt-1">Entrez le code PIN</span>
          </Link>
        </div>

        <div className="card animate-slide-up" style={{ animationDelay: '0.3s' }}>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-kahoot-purple rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-800">
              {isAuthenticated ? 'Mes quiz' : 'Quiz'}
            </h2>
            {isAuthenticated && quizzes.length > 0 && (
              <span className="bg-kahoot-purple/10 text-kahoot-purple px-3 py-1 rounded-full text-sm font-medium">
                {quizzes.length}
              </span>
            )}
          </div>

          {!isAuthenticated ? (
            <div className="text-center py-12 animate-fade-in">
              <div className="w-24 h-24 mx-auto mb-6 relative">
                <div className="absolute inset-0 bg-gray-100 rounded-full flex items-center justify-center">
                  <span className="text-5xl">🔐</span>
                </div>
              </div>
              <p className="text-gray-500 text-lg mb-2">Connectez-vous pour voir vos quiz</p>
              <p className="text-gray-400 text-sm mb-4">Creez et gerez vos quiz personnels</p>
              <Link
                to="/login"
                onClick={() => playClick()}
                className="btn btn-primary inline-block"
              >
                Se connecter
              </Link>
            </div>
          ) : loading ? (
            <div className="text-center py-12">
              <div className="relative w-16 h-16 mx-auto">
                <div className="absolute inset-0 bg-kahoot-purple/20 rounded-full animate-ping" />
                <div className="absolute inset-2 bg-kahoot-purple/30 rounded-full animate-pulse" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="animate-spin w-8 h-8 border-4 border-kahoot-purple border-t-transparent rounded-full"></div>
                </div>
              </div>
              <p className="text-gray-500 mt-4">Chargement...</p>
            </div>
          ) : quizzes.length === 0 ? (
            <div className="text-center py-12 animate-fade-in">
              <div className="w-24 h-24 mx-auto mb-6 relative">
                <div className="absolute inset-0 bg-gray-100 rounded-full flex items-center justify-center">
                  <span className="text-5xl">📝</span>
                </div>
              </div>
              <p className="text-gray-500 text-lg mb-2">Aucun quiz créé</p>
              <p className="text-gray-400 text-sm">Commencez par en créer un !</p>
            </div>
          ) : (
            <div className="space-y-3">
              {quizzes.map((quiz, index) => (
                <div
                  key={quiz.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-all duration-200 animate-slide-up group"
                  style={{ animationDelay: `${0.4 + index * 0.1}s` }}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-kahoot-purple to-purple-700 rounded-xl flex items-center justify-center text-white font-bold shadow-md">
                      {quiz.title.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-800 group-hover:text-kahoot-purple transition-colors">{quiz.title}</h3>
                      <p className="text-sm text-gray-500 flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {quiz._count.questions} question{quiz._count.questions > 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => startGame(quiz.id)}
                      className="btn btn-success text-sm py-2 btn-glow ripple flex items-center gap-1"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                      </svg>
                      Jouer
                    </button>
                    <Link
                      to={`/edit/${quiz.id}`}
                      onClick={() => playClick()}
                      className="btn bg-gray-500 hover:bg-gray-600 text-sm py-2 ripple flex items-center gap-1"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Modifier
                    </Link>
                    <button
                      onClick={() => deleteQuiz(quiz.id)}
                      className="btn btn-danger text-sm py-2 ripple flex items-center gap-1"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Supprimer
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-white/40 text-sm animate-fade-in" style={{ animationDelay: '0.6s' }}>
          <p>Kahoot Clone - Quiz interactif</p>
        </div>
      </div>
    </div>
  );
}

export default Home;

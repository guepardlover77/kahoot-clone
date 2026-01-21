import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ParticleBackground from '../components/ParticleBackground';
import { useSoundContext } from '../context/SoundContext';

function Login() {
  const { isAuthenticated, loading, login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { playClick } = useSoundContext();

  const error = searchParams.get('error');

  useEffect(() => {
    if (!loading && isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, loading, navigate]);

  const handleGoogleLogin = () => {
    playClick();
    login();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-kahoot-purple flex items-center justify-center">
        <div className="animate-spin w-12 h-12 border-4 border-white border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-kahoot-purple p-4 relative overflow-hidden flex items-center justify-center">
      <ParticleBackground />

      <div className="card max-w-md w-full relative z-10 animate-scale-in">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-kahoot-purple/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-4xl">🎯</span>
          </div>
          <h1 className="text-3xl font-black text-gray-800 mb-2">Kahoot Clone</h1>
          <p className="text-gray-500">Connectez-vous pour creer et gerer vos quiz</p>
        </div>

        {error && (
          <div className="bg-red-100 text-red-700 p-4 rounded-xl mb-6 text-center">
            Erreur lors de la connexion. Veuillez reessayer.
          </div>
        )}

        <button
          onClick={handleGoogleLogin}
          className="w-full flex items-center justify-center gap-3 bg-white border-2 border-gray-200 hover:border-gray-300 text-gray-700 font-semibold py-4 px-6 rounded-xl transition-all duration-200 hover:shadow-lg group"
        >
          <svg className="w-6 h-6" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          <span>Se connecter avec Google</span>
        </button>

        <div className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-center text-gray-500 text-sm mb-4">
            Vous voulez juste jouer ?
          </p>
          <button
            onClick={() => {
              playClick();
              navigate('/join');
            }}
            className="w-full btn bg-kahoot-blue hover:bg-blue-600 text-white py-3"
          >
            Rejoindre une partie
          </button>
        </div>
      </div>
    </div>
  );
}

export default Login;

import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import ParticleBackground from '../components/ParticleBackground';
import SoundToggle from '../components/SoundToggle';
import { useSoundContext } from '../context/SoundContext';

function JoinGame() {
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { playClick } = useSoundContext();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (pin.length !== 6) {
      alert('Le code PIN doit contenir 6 chiffres');
      return;
    }

    playClick();
    setLoading(true);

    try {
      const res = await fetch(`/api/game/check/${pin}`);
      const data = await res.json();

      if (res.ok) {
        navigate(`/play/${pin}`);
      } else {
        alert(data.error || 'Partie non trouvée');
      }
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur de connexion au serveur');
    } finally {
      setLoading(false);
    }
  };

  const handlePinChange = (e) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
    setPin(value);
  };

  return (
    <div className="min-h-screen bg-kahoot-purple flex flex-col items-center justify-center p-4 relative overflow-hidden">
      <ParticleBackground />
      <SoundToggle className="absolute top-4 right-4 z-20" />

      <Link
        to="/"
        onClick={() => playClick()}
        className="absolute top-4 left-4 text-white hover:text-purple-200 flex items-center gap-2 z-20 transition-all duration-200 hover:scale-105"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Accueil
      </Link>

      <div className="relative z-10 w-full max-w-md">
        {/* Logo animé */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="w-24 h-24 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-float">
            <span className="text-5xl">🎮</span>
          </div>
        </div>

        {/* Carte principale avec bordure gradient */}
        <div className="gradient-border rounded-2xl animate-zoom-in">
          <div className="card rounded-2xl">
            <h1 className="text-3xl font-black text-center text-kahoot-purple mb-2">
              Rejoindre
            </h1>
            <p className="text-gray-500 text-center mb-8">Entrez le code de la partie</p>

            <form onSubmit={handleSubmit}>
              <div className="mb-6">
                <div className="relative">
                  <input
                    type="text"
                    inputMode="numeric"
                    value={pin}
                    onChange={handlePinChange}
                    className="input text-center text-4xl tracking-[0.5em] font-black py-6 focus:ring-4 focus:ring-kahoot-purple/30"
                    placeholder="000000"
                    maxLength={6}
                    autoFocus
                  />
                  {pin.length > 0 && pin.length < 6 && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2">
                      <span className="text-gray-400 text-sm font-medium">{pin.length}/6</span>
                    </div>
                  )}
                  {pin.length === 6 && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 animate-bounce-in">
                      <svg className="w-6 h-6 text-kahoot-green" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </div>

                {/* Indicateur de progression */}
                <div className="flex justify-center gap-2 mt-4">
                  {[...Array(6)].map((_, i) => (
                    <div
                      key={i}
                      className={`w-3 h-3 rounded-full transition-all duration-200 ${
                        i < pin.length
                          ? 'bg-kahoot-purple scale-110'
                          : 'bg-gray-200'
                      }`}
                    />
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={pin.length !== 6 || loading}
                className="btn btn-success w-full text-xl py-4 btn-glow ripple disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-3">
                    <div className="animate-spin w-6 h-6 border-3 border-white border-t-transparent rounded-full"></div>
                    Connexion...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    Entrer
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </span>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Message d'aide */}
        <div className="mt-8 text-center animate-fade-in" style={{ animationDelay: '0.3s' }}>
          <div className="glass-card p-4 inline-block">
            <p className="text-white/80 text-sm flex items-center gap-2">
              <svg className="w-5 h-5 text-yellow-300" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              Entrez le code PIN affiché sur l'écran de l'hôte
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default JoinGame;

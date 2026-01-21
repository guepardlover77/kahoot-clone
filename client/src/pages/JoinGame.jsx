import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

function JoinGame() {
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (pin.length !== 6) {
      alert('Le code PIN doit contenir 6 chiffres');
      return;
    }

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
    <div className="min-h-screen bg-kahoot-purple flex flex-col items-center justify-center p-4">
      <Link to="/" className="absolute top-4 left-4 text-white hover:text-purple-200 flex items-center gap-2">
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Accueil
      </Link>

      <div className="card w-full max-w-md animate-bounce-in">
        <h1 className="text-3xl font-black text-center text-kahoot-purple mb-8">
          Kahoot Clone
        </h1>

        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <input
              type="text"
              inputMode="numeric"
              value={pin}
              onChange={handlePinChange}
              className="input text-center text-3xl tracking-widest font-bold"
              placeholder="Code PIN"
              maxLength={6}
              autoFocus
            />
          </div>

          <button
            type="submit"
            disabled={pin.length !== 6 || loading}
            className="btn btn-success w-full text-xl py-4"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full"></div>
                Connexion...
              </span>
            ) : (
              "Entrer"
            )}
          </button>
        </form>
      </div>

      <div className="mt-8 text-white/60 text-sm text-center">
        <p>Entrez le code PIN affiché sur l'écran de l'hôte</p>
      </div>
    </div>
  );
}

export default JoinGame;

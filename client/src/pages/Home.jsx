import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

function Home() {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchQuizzes();
  }, []);

  const fetchQuizzes = async () => {
    try {
      const res = await fetch('/api/quiz');
      const data = await res.json();
      setQuizzes(data);
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  const startGame = async (quizId) => {
    try {
      const res = await fetch('/api/game/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
    try {
      await fetch(`/api/quiz/${id}`, { method: 'DELETE' });
      fetchQuizzes();
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  return (
    <div className="min-h-screen bg-kahoot-purple p-4">
      <div className="max-w-4xl mx-auto">
        <header className="text-center py-8">
          <h1 className="text-5xl font-black text-white mb-2">Kahoot Clone</h1>
          <p className="text-purple-200 text-lg">Quiz interactif en temps réel</p>
        </header>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <Link
            to="/create"
            className="card hover:shadow-3xl transition-shadow flex flex-col items-center justify-center py-8"
          >
            <div className="w-16 h-16 bg-kahoot-green rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <span className="text-xl font-bold text-gray-800">Créer un quiz</span>
          </Link>

          <Link
            to="/join"
            className="card hover:shadow-3xl transition-shadow flex flex-col items-center justify-center py-8"
          >
            <div className="w-16 h-16 bg-kahoot-blue rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <span className="text-xl font-bold text-gray-800">Rejoindre une partie</span>
          </Link>
        </div>

        <div className="card">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Mes quiz</h2>

          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin w-8 h-8 border-4 border-kahoot-purple border-t-transparent rounded-full mx-auto"></div>
            </div>
          ) : quizzes.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              Aucun quiz créé. Commencez par en créer un !
            </p>
          ) : (
            <div className="space-y-4">
              {quizzes.map((quiz) => (
                <div
                  key={quiz.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div>
                    <h3 className="font-bold text-gray-800">{quiz.title}</h3>
                    <p className="text-sm text-gray-500">
                      {quiz._count.questions} question{quiz._count.questions > 1 ? 's' : ''}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => startGame(quiz.id)}
                      className="btn btn-success text-sm py-2"
                    >
                      Jouer
                    </button>
                    <Link
                      to={`/edit/${quiz.id}`}
                      className="btn bg-gray-500 hover:bg-gray-600 text-sm py-2"
                    >
                      Modifier
                    </Link>
                    <button
                      onClick={() => deleteQuiz(quiz.id)}
                      className="btn btn-danger text-sm py-2"
                    >
                      Supprimer
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Home;

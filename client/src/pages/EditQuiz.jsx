import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import QuestionEditor from '../components/QuestionEditor';
import ParticleBackground from '../components/ParticleBackground';
import SoundToggle from '../components/SoundToggle';
import { useSoundContext } from '../context/SoundContext';

function EditQuiz() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { playClick } = useSoundContext();
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [questions, setQuestions] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchQuiz();
  }, [id]);

  const fetchQuiz = async () => {
    try {
      const res = await fetch(`/api/quiz/${id}`, {
        credentials: 'include'
      });
      if (!res.ok) throw new Error('Quiz non trouvé');

      const quiz = await res.json();
      setTitle(quiz.title);
      setDescription(quiz.description || '');
      setQuestions(quiz.questions.map(q => ({
        text: q.text,
        type: q.type || 'MULTIPLE_CHOICE',
        timeLimit: q.timeLimit,
        points: q.points,
        correctAnswer: q.correctAnswer || '',
        answers: q.answers.length === 4 ? q.answers : [
          ...q.answers,
          ...Array(4 - q.answers.length).fill({ text: '', isCorrect: false })
        ]
      })));
    } catch (error) {
      console.error('Erreur:', error);
      alert('Quiz non trouvé');
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const addQuestion = () => {
    playClick();
    setQuestions([
      ...questions,
      {
        text: '',
        type: 'MULTIPLE_CHOICE',
        timeLimit: 20,
        points: 1000,
        answers: [
          { text: '', isCorrect: true },
          { text: '', isCorrect: false },
          { text: '', isCorrect: false },
          { text: '', isCorrect: false }
        ]
      }
    ]);
  };

  const updateQuestion = (index, updatedQuestion) => {
    const newQuestions = [...questions];
    newQuestions[index] = updatedQuestion;
    setQuestions(newQuestions);
  };

  const removeQuestion = (index) => {
    playClick();
    if (questions.length > 1) {
      setQuestions(questions.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!title.trim()) {
      alert('Veuillez entrer un titre');
      return;
    }

    if (questions.some(q => !q.text.trim())) {
      alert('Toutes les questions doivent avoir un texte');
      return;
    }

    // Validation selon le type de question
    for (const q of questions) {
      const type = q.type || 'MULTIPLE_CHOICE';

      if (type === 'PUZZLE') {
        if (!q.correctAnswer || !q.correctAnswer.trim()) {
          alert('Les questions Puzzle doivent avoir une réponse correcte');
          return;
        }
      } else if (type !== 'SURVEY') {
        if ((q.answers || []).filter(a => a.text.trim()).length < 2) {
          alert('Chaque question doit avoir au moins 2 réponses');
          return;
        }
        if (type !== 'DRAG_DROP' && !(q.answers || []).some(a => a.isCorrect && a.text.trim())) {
          alert('Chaque question (sauf sondage) doit avoir au moins une bonne réponse');
          return;
        }
      } else {
        if ((q.answers || []).filter(a => a.text.trim()).length < 2) {
          alert('Les sondages doivent avoir au moins 2 options');
          return;
        }
      }
    }

    playClick();
    setSaving(true);

    try {
      const res = await fetch(`/api/quiz/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          title,
          description,
          questions: questions.map(q => ({
            ...q,
            answers: q.answers.filter(a => a.text.trim())
          }))
        })
      });

      if (res.ok) {
        navigate('/');
      } else {
        throw new Error('Erreur lors de la mise à jour');
      }
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de la mise à jour du quiz');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-kahoot-purple flex items-center justify-center relative overflow-hidden">
        <ParticleBackground />
        <div className="text-center relative z-10">
          <div className="relative w-20 h-20 mx-auto mb-4">
            <div className="absolute inset-0 bg-white/20 rounded-full animate-ping" />
            <div className="absolute inset-2 bg-white/30 rounded-full animate-pulse" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="animate-spin w-10 h-10 border-4 border-white border-t-transparent rounded-full"></div>
            </div>
          </div>
          <p className="text-white/80 animate-pulse">Chargement du quiz...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-kahoot-purple p-4 relative overflow-hidden">
      <ParticleBackground />
      <SoundToggle className="absolute top-4 right-4 z-20" />

      <div className="max-w-3xl mx-auto relative z-10">
        <div className="flex items-center justify-between mb-6 animate-fade-in">
          <Link
            to="/"
            onClick={() => playClick()}
            className="text-white hover:text-purple-200 flex items-center gap-2 transition-all duration-200 hover:scale-105"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Retour
          </Link>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </div>
            Modifier le quiz
          </h1>
          <div className="w-20"></div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="card mb-6 animate-slide-up" style={{ animationDelay: '0.1s' }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-kahoot-purple/10 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-kahoot-purple" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-lg font-bold text-gray-800">Informations du quiz</h2>
            </div>

            <div className="mb-4">
              <label className="block text-gray-700 font-bold mb-2">
                Titre du quiz
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="input focus:ring-4 focus:ring-kahoot-purple/30"
                placeholder="Ex: Culture générale"
                required
              />
            </div>
            <div>
              <label className="block text-gray-700 font-bold mb-2">
                Description (optionnel)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="input resize-none focus:ring-4 focus:ring-kahoot-purple/30"
                rows={2}
                placeholder="Une courte description du quiz"
              />
            </div>
          </div>

          <div className="space-y-4">
            {questions.map((question, index) => (
              <div
                key={index}
                className="animate-slide-up"
                style={{ animationDelay: `${0.2 + index * 0.1}s` }}
              >
                <QuestionEditor
                  question={question}
                  index={index}
                  onChange={(q) => updateQuestion(index, q)}
                  onRemove={() => removeQuestion(index)}
                  canRemove={questions.length > 1}
                />
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={addQuestion}
            className="w-full mt-4 p-4 border-2 border-dashed border-white/50 rounded-xl text-white hover:bg-white/10 transition-all duration-300 hover:border-white hover:scale-[1.02] flex items-center justify-center gap-2 animate-fade-in"
            style={{ animationDelay: '0.4s' }}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Ajouter une question
          </button>

          <div className="flex gap-4 mt-6 animate-slide-up" style={{ animationDelay: '0.5s' }}>
            <Link
              to="/"
              onClick={() => playClick()}
              className="btn bg-gray-500 hover:bg-gray-600 flex-1 text-center ripple"
            >
              Annuler
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="btn btn-success flex-1 btn-glow ripple flex items-center justify-center gap-2"
            >
              {saving ? (
                <>
                  <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full"></div>
                  Enregistrement...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Enregistrer
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditQuiz;

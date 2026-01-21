import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import QuestionEditor from '../components/QuestionEditor';

function CreateQuiz() {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [questions, setQuestions] = useState([
    {
      text: '',
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
  const [saving, setSaving] = useState(false);

  const addQuestion = () => {
    setQuestions([
      ...questions,
      {
        text: '',
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

    if (questions.some(q => q.answers.filter(a => a.text.trim()).length < 2)) {
      alert('Chaque question doit avoir au moins 2 réponses');
      return;
    }

    if (questions.some(q => !q.answers.some(a => a.isCorrect && a.text.trim()))) {
      alert('Chaque question doit avoir au moins une bonne réponse');
      return;
    }

    setSaving(true);

    try {
      const res = await fetch('/api/quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
        throw new Error('Erreur lors de la création');
      }
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de la création du quiz');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-kahoot-purple p-4">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <Link to="/" className="text-white hover:text-purple-200 flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Retour
          </Link>
          <h1 className="text-2xl font-bold text-white">Créer un quiz</h1>
          <div className="w-20"></div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="card mb-6">
            <div className="mb-4">
              <label className="block text-gray-700 font-bold mb-2">
                Titre du quiz
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="input"
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
                className="input resize-none"
                rows={2}
                placeholder="Une courte description du quiz"
              />
            </div>
          </div>

          <div className="space-y-4">
            {questions.map((question, index) => (
              <QuestionEditor
                key={index}
                question={question}
                index={index}
                onChange={(q) => updateQuestion(index, q)}
                onRemove={() => removeQuestion(index)}
                canRemove={questions.length > 1}
              />
            ))}
          </div>

          <button
            type="button"
            onClick={addQuestion}
            className="w-full mt-4 p-4 border-2 border-dashed border-white/50 rounded-xl text-white hover:bg-white/10 transition-colors"
          >
            + Ajouter une question
          </button>

          <div className="flex gap-4 mt-6">
            <Link to="/" className="btn bg-gray-500 hover:bg-gray-600 flex-1 text-center">
              Annuler
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="btn btn-success flex-1"
            >
              {saving ? 'Enregistrement...' : 'Créer le quiz'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateQuiz;

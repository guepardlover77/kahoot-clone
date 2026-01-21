const answerColors = [
  'bg-kahoot-red',
  'bg-kahoot-blue',
  'bg-kahoot-yellow',
  'bg-kahoot-green'
];

const answerShapes = ['triangle', 'diamond', 'circle', 'square'];

function QuestionEditor({ question, index, onChange, onRemove, canRemove }) {
  const updateAnswer = (answerIndex, field, value) => {
    const newAnswers = [...question.answers];
    newAnswers[answerIndex] = { ...newAnswers[answerIndex], [field]: value };

    // Si on coche une réponse comme correcte, assurer qu'il y en a toujours une
    if (field === 'isCorrect' && value === true) {
      // Mode simple: une seule bonne réponse
      newAnswers.forEach((a, i) => {
        if (i !== answerIndex) a.isCorrect = false;
      });
    }

    onChange({ ...question, answers: newAnswers });
  };

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <span className="bg-kahoot-purple text-white px-3 py-1 rounded-full text-sm font-bold">
          Question {index + 1}
        </span>
        {canRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="text-red-500 hover:text-red-700"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        )}
      </div>

      <div className="mb-4">
        <textarea
          value={question.text}
          onChange={(e) => onChange({ ...question, text: e.target.value })}
          className="input resize-none text-center text-lg"
          rows={2}
          placeholder="Entrez votre question..."
          required
        />
      </div>

      <div className="flex gap-4 mb-4">
        <div className="flex-1">
          <label className="block text-gray-600 text-sm mb-1">Temps (secondes)</label>
          <select
            value={question.timeLimit}
            onChange={(e) => onChange({ ...question, timeLimit: parseInt(e.target.value) })}
            className="input py-2"
          >
            {[5, 10, 15, 20, 30, 45, 60].map((t) => (
              <option key={t} value={t}>{t}s</option>
            ))}
          </select>
        </div>
        <div className="flex-1">
          <label className="block text-gray-600 text-sm mb-1">Points</label>
          <select
            value={question.points}
            onChange={(e) => onChange({ ...question, points: parseInt(e.target.value) })}
            className="input py-2"
          >
            {[500, 1000, 1500, 2000].map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {question.answers.map((answer, aIndex) => (
          <div
            key={aIndex}
            className={`${answerColors[aIndex]} rounded-lg p-3 flex items-center gap-2`}
          >
            <Shape type={answerShapes[aIndex]} />
            <input
              type="text"
              value={answer.text}
              onChange={(e) => updateAnswer(aIndex, 'text', e.target.value)}
              className="flex-1 bg-white/20 rounded px-2 py-1 text-white placeholder-white/70 outline-none"
              placeholder={`Réponse ${aIndex + 1}`}
            />
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={answer.isCorrect}
                onChange={(e) => updateAnswer(aIndex, 'isCorrect', e.target.checked)}
                className="w-5 h-5 rounded"
              />
            </label>
          </div>
        ))}
      </div>

      <p className="text-xs text-gray-500 mt-2 text-center">
        Cochez la ou les bonnes réponses
      </p>
    </div>
  );
}

function Shape({ type }) {
  const className = "w-6 h-6 text-white/80";

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

export default QuestionEditor;

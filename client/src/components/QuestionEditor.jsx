import { useState } from 'react';

const answerColors = [
  'bg-kahoot-red',
  'bg-kahoot-blue',
  'bg-kahoot-yellow',
  'bg-kahoot-green'
];

const answerShapes = ['triangle', 'diamond', 'circle', 'square'];

const questionTypes = [
  { value: 'MULTIPLE_CHOICE', label: 'Choix multiple', icon: '4' },
  { value: 'TRUE_FALSE', label: 'Vrai / Faux', icon: 'V/F' },
  { value: 'SURVEY', label: 'Sondage', icon: '?' },
  { value: 'PUZZLE', label: 'Puzzle', icon: 'ABC' },
  { value: 'DRAG_DROP', label: 'Glisser-d\u00e9poser', icon: '\u2195' }
];

function QuestionEditor({ question, index, onChange, onRemove, canRemove }) {
  const [draggedItem, setDraggedItem] = useState(null);

  const updateAnswer = (answerIndex, field, value) => {
    const newAnswers = [...question.answers];
    newAnswers[answerIndex] = { ...newAnswers[answerIndex], [field]: value };

    // Si on coche une r\u00e9ponse comme correcte, assurer qu'il y en a toujours une
    if (field === 'isCorrect' && value === true && question.type !== 'SURVEY') {
      // Mode simple: une seule bonne r\u00e9ponse
      newAnswers.forEach((a, i) => {
        if (i !== answerIndex) a.isCorrect = false;
      });
    }

    onChange({ ...question, answers: newAnswers });
  };

  const handleTypeChange = (newType) => {
    let newQuestion = { ...question, type: newType };

    // Adapter les r\u00e9ponses au nouveau type
    switch (newType) {
      case 'TRUE_FALSE':
        newQuestion.answers = [
          { text: 'Vrai', isCorrect: true },
          { text: 'Faux', isCorrect: false }
        ];
        break;
      case 'SURVEY':
        // Garder les r\u00e9ponses mais supprimer les "isCorrect"
        newQuestion.answers = question.answers.map(a => ({ ...a, isCorrect: false }));
        break;
      case 'PUZZLE':
        newQuestion.answers = [];
        newQuestion.correctAnswer = question.correctAnswer || '';
        newQuestion.caseSensitive = question.caseSensitive || false;
        break;
      case 'DRAG_DROP':
        // Conserver les r\u00e9ponses existantes ou en cr\u00e9er
        if (question.answers.length < 2) {
          newQuestion.answers = [
            { text: '\u00c9l\u00e9ment 1', isCorrect: false },
            { text: '\u00c9l\u00e9ment 2', isCorrect: false },
            { text: '\u00c9l\u00e9ment 3', isCorrect: false }
          ];
        }
        break;
      case 'MULTIPLE_CHOICE':
      default:
        // S'assurer d'avoir 4 r\u00e9ponses
        if (question.answers.length < 4) {
          newQuestion.answers = [
            { text: '', isCorrect: false },
            { text: '', isCorrect: false },
            { text: '', isCorrect: false },
            { text: '', isCorrect: false }
          ];
        }
        break;
    }

    onChange(newQuestion);
  };

  const addAnswer = () => {
    if (question.answers.length < 4) {
      onChange({
        ...question,
        answers: [...question.answers, { text: '', isCorrect: false }]
      });
    }
  };

  const removeAnswer = (answerIndex) => {
    if (question.answers.length > 2) {
      const newAnswers = question.answers.filter((_, i) => i !== answerIndex);
      onChange({ ...question, answers: newAnswers });
    }
  };

  // Drag and drop pour r\u00e9ordonner
  const handleDragStart = (e, answerIndex) => {
    setDraggedItem(answerIndex);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, answerIndex) => {
    e.preventDefault();
    if (draggedItem === null || draggedItem === answerIndex) return;

    const newAnswers = [...question.answers];
    const draggedAnswer = newAnswers[draggedItem];
    newAnswers.splice(draggedItem, 1);
    newAnswers.splice(answerIndex, 0, draggedAnswer);

    setDraggedItem(answerIndex);
    onChange({ ...question, answers: newAnswers });
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
  };

  const renderAnswersUI = () => {
    switch (question.type) {
      case 'TRUE_FALSE':
        return (
          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => {
                onChange({
                  ...question,
                  answers: [
                    { text: 'Vrai', isCorrect: true },
                    { text: 'Faux', isCorrect: false }
                  ]
                });
              }}
              className={`p-6 rounded-xl text-white font-bold text-2xl transition-all ${
                question.answers[0]?.isCorrect
                  ? 'bg-kahoot-green ring-4 ring-white scale-105'
                  : 'bg-kahoot-green/50 hover:bg-kahoot-green/70'
              }`}
            >
              Vrai
            </button>
            <button
              type="button"
              onClick={() => {
                onChange({
                  ...question,
                  answers: [
                    { text: 'Vrai', isCorrect: false },
                    { text: 'Faux', isCorrect: true }
                  ]
                });
              }}
              className={`p-6 rounded-xl text-white font-bold text-2xl transition-all ${
                question.answers[1]?.isCorrect
                  ? 'bg-kahoot-red ring-4 ring-white scale-105'
                  : 'bg-kahoot-red/50 hover:bg-kahoot-red/70'
              }`}
            >
              Faux
            </button>
          </div>
        );

      case 'SURVEY':
        return (
          <div className="space-y-3">
            {question.answers.map((answer, aIndex) => (
              <div
                key={aIndex}
                className={`${answerColors[aIndex % 4]} rounded-lg p-3 flex items-center gap-2`}
              >
                <Shape type={answerShapes[aIndex % 4]} />
                <input
                  type="text"
                  value={answer.text}
                  onChange={(e) => updateAnswer(aIndex, 'text', e.target.value)}
                  className="flex-1 bg-white/20 rounded px-2 py-1 text-white placeholder-white/70 outline-none"
                  placeholder={`Option ${aIndex + 1}`}
                />
                {question.answers.length > 2 && (
                  <button
                    type="button"
                    onClick={() => removeAnswer(aIndex)}
                    className="text-white/70 hover:text-white"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            ))}
            {question.answers.length < 4 && (
              <button
                type="button"
                onClick={addAnswer}
                className="w-full p-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-kahoot-purple hover:text-kahoot-purple transition-colors"
              >
                + Ajouter une option
              </button>
            )}
            <p className="text-xs text-gray-500 text-center">
              Les sondages n'ont pas de bonne r\u00e9ponse et ne donnent pas de points
            </p>
          </div>
        );

      case 'PUZZLE':
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-gray-600 text-sm mb-1">R\u00e9ponse correcte</label>
              <input
                type="text"
                value={question.correctAnswer || ''}
                onChange={(e) => onChange({ ...question, correctAnswer: e.target.value })}
                className="input"
                placeholder="La r\u00e9ponse que les joueurs doivent deviner..."
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id={`caseSensitive-${index}`}
                checked={question.caseSensitive || false}
                onChange={(e) => onChange({ ...question, caseSensitive: e.target.checked })}
                className="w-4 h-4 rounded"
              />
              <label htmlFor={`caseSensitive-${index}`} className="text-sm text-gray-600">
                Sensible \u00e0 la casse (majuscules/minuscules)
              </label>
            </div>
            <p className="text-xs text-gray-500 text-center">
              Les joueurs devront taper la r\u00e9ponse exacte
            </p>
          </div>
        );

      case 'DRAG_DROP':
        return (
          <div className="space-y-3">
            <p className="text-sm text-gray-600 mb-2">
              Ordonnez les \u00e9l\u00e9ments dans le bon ordre (glissez pour r\u00e9ordonner) :
            </p>
            {question.answers.map((answer, aIndex) => (
              <div
                key={aIndex}
                draggable
                onDragStart={(e) => handleDragStart(e, aIndex)}
                onDragOver={(e) => handleDragOver(e, aIndex)}
                onDragEnd={handleDragEnd}
                className={`${answerColors[aIndex % 4]} rounded-lg p-3 flex items-center gap-2 cursor-move ${
                  draggedItem === aIndex ? 'opacity-50' : ''
                }`}
              >
                <div className="text-white/70">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                  </svg>
                </div>
                <span className="text-white font-bold w-6">{aIndex + 1}.</span>
                <input
                  type="text"
                  value={answer.text}
                  onChange={(e) => updateAnswer(aIndex, 'text', e.target.value)}
                  className="flex-1 bg-white/20 rounded px-2 py-1 text-white placeholder-white/70 outline-none"
                  placeholder={`\u00c9l\u00e9ment ${aIndex + 1}`}
                />
                {question.answers.length > 2 && (
                  <button
                    type="button"
                    onClick={() => removeAnswer(aIndex)}
                    className="text-white/70 hover:text-white"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            ))}
            {question.answers.length < 4 && (
              <button
                type="button"
                onClick={addAnswer}
                className="w-full p-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-kahoot-purple hover:text-kahoot-purple transition-colors"
              >
                + Ajouter un \u00e9l\u00e9ment
              </button>
            )}
            <p className="text-xs text-gray-500 text-center">
              Les joueurs devront remettre les \u00e9l\u00e9ments dans cet ordre
            </p>
          </div>
        );

      case 'MULTIPLE_CHOICE':
      default:
        return (
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
                  placeholder={`R\u00e9ponse ${aIndex + 1}`}
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
        );
    }
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

      {/* S\u00e9lecteur de type de question */}
      <div className="mb-4">
        <label className="block text-gray-600 text-sm mb-2">Type de question</label>
        <div className="flex flex-wrap gap-2">
          {questionTypes.map((type) => (
            <button
              key={type.value}
              type="button"
              onClick={() => handleTypeChange(type.value)}
              className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
                question.type === type.value
                  ? 'bg-kahoot-purple text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <span className="text-xs font-bold bg-white/20 px-2 py-0.5 rounded">
                {type.icon}
              </span>
              {type.label}
            </button>
          ))}
        </div>
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
            {[5, 10, 15, 20, 30, 45, 60, 90, 120].map((t) => (
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
            disabled={question.type === 'SURVEY'}
          >
            {[0, 500, 1000, 1500, 2000].map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>
      </div>

      {renderAnswersUI()}

      {question.type === 'MULTIPLE_CHOICE' && (
        <p className="text-xs text-gray-500 mt-2 text-center">
          Cochez la bonne r\u00e9ponse
        </p>
      )}
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

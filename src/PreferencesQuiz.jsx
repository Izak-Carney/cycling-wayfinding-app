import { useState } from 'react'
import { QUIZ_QUESTIONS, recommendRoute } from './quiz'
import { SIGHTSEEING_ROUTES } from './presets'

function PreferencesQuiz({ onComplete, onSkip }) {
  const [answers, setAnswers] = useState({})

  const allAnswered = QUIZ_QUESTIONS.every((q) => answers[q.key])

  function handleSubmit() {
    const recommended = recommendRoute(answers, SIGHTSEEING_ROUTES)
    onComplete(recommended)
  }

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.45)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10,
      }}
    >
      <div
        style={{
          background: 'white',
          borderRadius: 8,
          padding: '20px 24px',
          maxWidth: 380,
          width: '90%',
          maxHeight: '85vh',
          overflowY: 'auto',
          boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
          color: '#222',
          fontSize: 14,
        }}
      >
        <h2 style={{ fontSize: 18, margin: '0 0 4px' }}>Plan your ride</h2>
        <p style={{ margin: '0 0 16px', color: '#555' }}>
          Answer a few questions and we'll suggest a sightseeing loop starting and ending at Volume One & The Local
          Store.
        </p>

        {QUIZ_QUESTIONS.map((q) => (
          <fieldset key={q.key} style={{ border: 'none', padding: 0, margin: '0 0 14px' }}>
            <legend style={{ fontWeight: 600, marginBottom: 6, padding: 0 }}>{q.question}</legend>
            {q.options.map((option) => (
              <label key={option.value} style={{ display: 'block', marginBottom: 4, cursor: 'pointer' }}>
                <input
                  type="radio"
                  name={q.key}
                  value={option.value}
                  checked={answers[q.key] === option.value}
                  onChange={() => setAnswers((prev) => ({ ...prev, [q.key]: option.value }))}
                  style={{ marginRight: 6 }}
                />
                {option.label}
              </label>
            ))}
          </fieldset>
        ))}

        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
          <button onClick={handleSubmit} disabled={!allAnswered} style={{ flex: 1 }}>
            Find my route
          </button>
          <button onClick={onSkip}>Skip, I'll pick myself</button>
        </div>
      </div>
    </div>
  )
}

export default PreferencesQuiz

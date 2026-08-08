// components/CopilotPanel.jsx — AI diagnosis panel

import { useState } from 'react'
import { postCopilot } from '../api/client.js'
import { getFixClass, getFixIcon } from './ScoreUtils.js'

export default function CopilotPanel({ routerId }) {
  const [question, setQuestion] = useState('Why is this router performing badly?')
  const [answer, setAnswer] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!question.trim() || !routerId) return

    setLoading(true)
    setError(null)
    setAnswer(null)

    try {
      const result = await postCopilot(routerId, question.trim())
      setAnswer(result)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const formatNumberKey = (key) => {
    return key
      .replace(/_/g, ' ')
      .replace(/pct/g, '%')
      .replace(/mbps/gi, 'Mbps')
      .replace(/ms/gi, 'ms')
      .replace(/dbm/gi, 'dBm')
      .replace(/hr/gi, '/hr')
  }

  const formatNumberVal = (key, val) => {
    if (key === 'health_score') return `${val}/100`
    if (key === 'sample_count') return `${val} hrs`
    if (typeof val === 'number') return val.toFixed(2)
    return val
  }

  return (
    <div className="copilot-section">
      <div className="copilot-header">
        <div className="copilot-icon">🤖</div>
        <div>
          <div className="copilot-title">AI Copilot</div>
          <div className="copilot-subtitle">
            Grounded diagnosis · {routerId}
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="copilot-input-row">
        <input
          id="copilot-question-input"
          type="text"
          className="copilot-input"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ask about this router…"
          disabled={loading}
          aria-label="Copilot question"
        />
        <button
          id="copilot-submit-btn"
          type="submit"
          className="copilot-btn"
          disabled={loading || !question.trim()}
          aria-label="Submit question"
        >
          {loading ? '…' : 'Ask'}
        </button>
      </form>

      {error && (
        <div className="error-box" style={{ margin: 0 }}>
          {error}
        </div>
      )}

      {loading && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--text-muted)', fontSize: 13 }}>
          <div className="spinner" style={{ width: 20, height: 20, borderWidth: 2 }} />
          Analyzing router data…
        </div>
      )}

      {answer && !loading && (
        <div className="copilot-answer">
          {/* Fix badge */}
          {answer.fix && answer.fix !== 'none' ? (
            <div className={`fix-badge ${getFixClass(answer.fix)}`}>
              {getFixIcon(answer.fix)} Recommended Fix: {answer.fix}
            </div>
          ) : (
            <div className="fix-badge fix-none">
              ✅ No fix needed — router is healthy
            </div>
          )}

          {/* Cause */}
          <div className="copilot-cause">
            <div className="copilot-cause-label">Root Cause</div>
            <div className="copilot-cause-text">{answer.cause}</div>
          </div>

          {/* Supporting numbers */}
          {answer.numbers && (
            <>
              <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-muted)', marginBottom: 8 }}>
                Supporting Data
              </div>
              <div className="copilot-numbers">
                {Object.entries(answer.numbers).map(([key, val]) => (
                  <div key={key} className="copilot-number-chip">
                    <div className="copilot-number-key">{formatNumberKey(key)}</div>
                    <div className="copilot-number-val">{formatNumberVal(key, val)}</div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Explanation */}
          {answer.explanation && (
            <div className="copilot-explanation">
              {answer.explanation}
            </div>
          )}

          {answer.source && (
            <div className="copilot-source">
              Powered by: {answer.source === 'gemini' ? 'Google Gemini 1.5 Flash' : 'Rule-based analysis'}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

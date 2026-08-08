// components/CopilotPanel.jsx — Grounded AI Copilot Diagnosis Panel

import { useState } from 'react'
import { Sparkles, Send, CheckCircle2, Wrench, RefreshCw, MapPin, AlertTriangle, BookOpen, Database, Bot } from 'lucide-react'
import { postCopilot } from '../api/client.js'
import { getFixBadgeInfo } from './ScoreUtils.js'

export default function CopilotPanel({ routerId, isDark }) {
  const [question, setQuestion] = useState('Why is this router performing badly?')
  const [answer, setAnswer] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const quickQuestions = [
    'Why is this router performing badly?',
    'Are complaints linked to metrics?',
    'Is this router healthy?',
  ]

  const handleSubmit = async (e) => {
    e?.preventDefault?.()
    if (!question.trim() || !routerId) return

    setLoading(true)
    setError(null)

    try {
      const result = await postCopilot(routerId, question.trim())
      setAnswer(result)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const formatKey = (key) => {
    return key
      .replace(/_/g, ' ')
      .replace(/pct/g, '%')
      .replace(/mbps/gi, 'Mbps')
      .replace(/ms/gi, 'ms')
      .replace(/dbm/gi, 'dBm')
      .replace(/hr/gi, '/hr')
  }

  const formatVal = (key, val) => {
    if (key === 'health_score') return `${val}/100`
    if (key === 'sample_count') return `${val} hrs`
    if (typeof val === 'number') return val.toFixed(2)
    return val
  }

  const fixInfo = answer?.fix ? getFixBadgeInfo(answer.fix) : null

  return (
    <div className="theme-card p-5 relative overflow-hidden border-2 border-blue-500/20 bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-transparent">
      
      {/* Copilot Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[var(--text-main)] flex items-center gap-2">
              AI Copilot Diagnostics
              <span className="text-[9px] uppercase font-mono px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-500 border border-purple-500/20">
                Grounded
              </span>
            </h3>
            <p className="text-xs text-[var(--text-muted)]">
              Context-aware insights for <strong className="font-mono text-[var(--text-main)]">{routerId}</strong>
            </p>
          </div>
        </div>

        {answer?.source && (
          <div className="text-[10px] font-mono text-[var(--text-subtle)] flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[var(--bg-chip)] border border-[var(--border-card)]">
            <Bot className="w-3.5 h-3.5 text-blue-500" />
            <span>{answer.source === 'gemini' ? 'Google Gemini 1.5' : 'Rule Engine'}</span>
          </div>
        )}
      </div>

      {/* Quick Question Chips */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        {quickQuestions.map((q) => (
          <button
            key={q}
            onClick={() => {
              setQuestion(q)
              setLoading(true)
              setError(null)
              postCopilot(routerId, q)
                .then(setAnswer)
                .catch((err) => setError(err.message))
                .finally(() => setLoading(false))
            }}
            className="text-[11px] px-2.5 py-1 rounded-lg bg-[var(--bg-chip)] border border-[var(--border-card)] text-[var(--text-secondary)] hover:text-[var(--text-main)] hover:border-[var(--border-bright)] transition-all cursor-pointer"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="flex gap-2 mb-4">
        <input
          type="text"
          id="copilot-input-field"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ask AI Copilot about this router's health…"
          className="flex-1 theme-input text-xs"
          disabled={loading}
          aria-label="Ask Copilot"
        />
        <button
          type="submit"
          id="copilot-submit-button"
          disabled={loading || !question.trim()}
          className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-semibold text-xs flex items-center gap-1.5 transition-all shadow-md shadow-blue-500/20 disabled:opacity-50 cursor-pointer"
        >
          {loading ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <Send className="w-3.5 h-3.5" />
              <span>Ask AI</span>
            </>
          )}
        </button>
      </form>

      {error && (
        <div className="p-3 mb-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-500 text-xs">
          {error}
        </div>
      )}

      {/* Answer Output Card */}
      {answer && !loading && (
        <div className="animate-fade-in space-y-3 pt-3 border-t border-[var(--border-app)]">
          
          {/* Fix Recommendation Badge */}
          <div className="flex items-center justify-between">
            <div className="text-[10px] uppercase font-bold tracking-wider text-[var(--text-subtle)]">
              Recommended Action
            </div>
            {fixInfo ? (
              <span className={`status-badge ${fixInfo.class}`}>
                {answer.fix === 'relocate router' && <MapPin className="w-3.5 h-3.5" />}
                {answer.fix === 'firmware update' && <RefreshCw className="w-3.5 h-3.5" />}
                {answer.fix === 'replace router' && <AlertTriangle className="w-3.5 h-3.5" />}
                {answer.fix === 'user education' && <BookOpen className="w-3.5 h-3.5" />}
                {(!answer.fix || answer.fix === 'none') && <CheckCircle2 className="w-3.5 h-3.5" />}
                <span>{fixInfo.label}</span>
              </span>
            ) : (
              <span className="status-badge badge-healthy">
                <CheckCircle2 className="w-3.5 h-3.5" /> No Fix Needed (Healthy)
              </span>
            )}
          </div>

          {/* Root Cause Card */}
          <div className="p-3 rounded-xl bg-[var(--bg-card)] border border-[var(--border-card)]">
            <div className="text-[10px] uppercase font-bold tracking-wider text-[var(--text-muted)] mb-1">
              Primary Diagnostic Cause
            </div>
            <p className="text-xs font-medium text-[var(--text-main)] leading-relaxed">
              {answer.cause}
            </p>
          </div>

          {/* Grounded Evidence Numbers Grid */}
          {answer.numbers && (
            <div>
              <div className="text-[10px] uppercase font-bold tracking-wider text-[var(--text-subtle)] mb-1.5 flex items-center gap-1">
                <Database className="w-3 h-3 text-blue-500" />
                <span>Supporting Dataset Evidence</span>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5">
                {Object.entries(answer.numbers).map(([k, v]) => (
                  <div key={k} className="p-2 rounded-lg bg-[var(--bg-input)] border border-[var(--border-card)] text-center">
                    <div className="text-[9px] uppercase tracking-wider text-[var(--text-muted)] truncate">
                      {formatKey(k)}
                    </div>
                    <div className="text-xs font-bold font-mono text-[var(--text-main)] mt-0.5">
                      {formatVal(k, v)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Detailed Explanation */}
          {answer.explanation && (
            <div className="text-xs text-[var(--text-secondary)] leading-relaxed pt-2 border-t border-[var(--border-app)]">
              {answer.explanation}
            </div>
          )}

        </div>
      )}

    </div>
  )
}

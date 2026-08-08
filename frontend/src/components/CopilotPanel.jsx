// components/CopilotPanel.jsx — Grounded AI Copilot Diagnosis Panel with Indigo/Violet SaaS Tint

import { useState } from 'react'
import {
  Sparkles, Send, CheckCircle2, RefreshCw, MapPin, AlertTriangle, BookOpen, Database, Bot
} from 'lucide-react'
import { postCopilot } from '../api/client.js'
import { getFixBadgeInfo } from './ScoreUtils.js'

export default function CopilotPanel({ routerId }) {
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
    <div className="enterprise-card p-4.5 bg-indigo-50/60 dark:bg-indigo-950/20 border-indigo-200/80 dark:border-indigo-800/40 relative overflow-hidden">
      
      {/* Copilot Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 dark:bg-indigo-500 flex items-center justify-center text-white shadow-xs">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-indigo-950 dark:text-indigo-200 flex items-center gap-2">
              AI Copilot Diagnostics
              <span className="text-[9px] uppercase font-mono px-1.5 py-0.2 rounded bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                Grounded
              </span>
            </h3>
            <p className="text-[11px] text-indigo-700/80 dark:text-indigo-300/70">
              Router <strong className="font-mono">{routerId}</strong>
            </p>
          </div>
        </div>

        {answer?.source && (
          <div className="text-[10px] font-mono text-indigo-700 dark:text-indigo-300 flex items-center gap-1 px-2 py-0.5 rounded bg-indigo-100/60 dark:bg-indigo-900/40 border border-indigo-200 dark:border-indigo-800">
            <Bot className="w-3 h-3 text-indigo-500" />
            <span>{answer.source === 'gemini' ? 'Google Gemini 1.5' : 'Rule Engine'}</span>
          </div>
        )}
      </div>

      {/* Quick Questions */}
      <div className="flex flex-wrap gap-1 mb-3">
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
            className="text-[11px] px-2 py-0.5 rounded bg-white/80 dark:bg-slate-900/60 border border-indigo-200/80 dark:border-indigo-800/60 text-indigo-900 dark:text-indigo-200 hover:border-indigo-400 transition-all cursor-pointer"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="flex gap-1.5 mb-3">
        <input
          type="text"
          id="copilot-input-field"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ask AI Copilot about this router..."
          className="flex-1 enterprise-input text-xs bg-white dark:bg-slate-900 border-indigo-200 dark:border-indigo-800 focus:ring-2 focus:ring-indigo-500"
          disabled={loading}
          aria-label="Ask Copilot"
        />
        <button
          type="submit"
          id="copilot-submit-button"
          disabled={loading || !question.trim()}
          className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center gap-1 transition-all shadow-xs disabled:opacity-50 cursor-pointer"
        >
          {loading ? (
            <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <Send className="w-3 h-3" />
              <span>Ask AI</span>
            </>
          )}
        </button>
      </form>

      {error && (
        <div className="p-2.5 mb-2.5 rounded-md bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-xs">
          {error}
        </div>
      )}

      {/* Answer Output */}
      {answer && !loading && (
        <div className="space-y-2.5 pt-2.5 border-t border-indigo-200/70 dark:border-indigo-800/50">
          
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase font-semibold tracking-wider text-indigo-700 dark:text-indigo-300">
              Recommended Action
            </span>
            {fixInfo ? (
              <span className={`status-badge ${fixInfo.class}`}>
                {answer.fix === 'relocate router' && <MapPin className="w-3 h-3" />}
                {answer.fix === 'firmware update' && <RefreshCw className="w-3 h-3" />}
                {answer.fix === 'replace router' && <AlertTriangle className="w-3 h-3" />}
                {answer.fix === 'user education' && <BookOpen className="w-3 h-3" />}
                {(!answer.fix || answer.fix === 'none') && <CheckCircle2 className="w-3 h-3" />}
                <span>{fixInfo.label}</span>
              </span>
            ) : (
              <span className="status-badge badge-healthy">
                <CheckCircle2 className="w-3 h-3" /> Healthy (No Fix Needed)
              </span>
            )}
          </div>

          <div className="p-2.5 rounded-md bg-white dark:bg-slate-900 border border-indigo-200/80 dark:border-indigo-800/60">
            <div className="text-[10px] uppercase font-semibold text-indigo-700 dark:text-indigo-300 mb-0.5">
              Diagnostic Cause
            </div>
            <p className="text-xs text-[var(--text-main)] leading-relaxed">
              {answer.cause}
            </p>
          </div>

          {answer.numbers && (
            <div>
              <div className="text-[10px] uppercase font-semibold text-indigo-700 dark:text-indigo-300 mb-1 flex items-center gap-1">
                <Database className="w-3 h-3 text-indigo-500" />
                <span>Supporting Evidence</span>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-1">
                {Object.entries(answer.numbers).map(([k, v]) => (
                  <div key={k} className="p-1.5 rounded bg-white dark:bg-slate-900 border border-indigo-200/60 dark:border-indigo-800/40 text-center">
                    <div className="text-[9px] uppercase tracking-wider text-[var(--text-muted)] truncate">
                      {formatKey(k)}
                    </div>
                    <div className="text-[11px] font-bold font-mono text-[var(--text-main)] mt-0.5">
                      {formatVal(k, v)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {answer.explanation && (
            <div className="text-[11px] text-[var(--text-secondary)] leading-relaxed pt-1.5 border-t border-indigo-200/60 dark:border-indigo-800/40">
              {answer.explanation}
            </div>
          )}

        </div>
      )}

    </div>
  )
}

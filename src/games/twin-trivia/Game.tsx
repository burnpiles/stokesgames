'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { GameSDK } from '@/lib/game-sdk'
import { TRIVIA_CONFIG, TRIVIA_QUESTIONS } from './game.config'

type GameState = 'TITLE' | 'PLAYING' | 'SCORE_SCREEN'

interface Props {
  gameId: string
  gameSlug: string
  mode?: string
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export default function TwinTrivia({ gameId, gameSlug }: Props) {
  const [gameState, setGameState] = useState<GameState>('TITLE')
  const [questions, setQuestions] = useState(shuffle(TRIVIA_QUESTIONS).slice(0, TRIVIA_CONFIG.totalQuestions))
  const [questionIndex, setQuestionIndex] = useState(0)
  const [score, setScore] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const [timeLeft, setTimeLeft] = useState(TRIVIA_CONFIG.timePerQuestion)
  const [streak, setStreak] = useState(0)
  const [correct, setCorrect] = useState(0)
  const [personalBest, setPersonalBest] = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const questionStartRef = useRef<number>(Date.now())
  const sdkRef = useRef<GameSDK | null>(null)

  useEffect(() => {
    sdkRef.current = new GameSDK({ gameId: 'twin-trivia', gameSlug: 'twin-trivia' })
    const pb = parseInt(localStorage.getItem('sg_pb_twin-trivia') ?? '0', 10)
    setPersonalBest(pb)
    sdkRef.current.onReady()
    return () => { sdkRef.current?.destroy(); sdkRef.current = null }
  }, [])

  const clearTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current)
  }, [])

  const nextQuestion = useCallback((currentIndex: number, currentScore: number) => {
    if (currentIndex + 1 >= TRIVIA_CONFIG.totalQuestions) {
      // Game over
      clearTimer()
      sdkRef.current?.onGameOver(currentScore)
      if (currentScore > personalBest) {
        localStorage.setItem('sg_pb_twin-trivia', String(currentScore))
        setPersonalBest(currentScore)
      }
      setGameState('SCORE_SCREEN')
    } else {
      setSelected(null)
      setTimeLeft(TRIVIA_CONFIG.timePerQuestion)
      setQuestionIndex(currentIndex + 1)
      questionStartRef.current = Date.now()
    }
  }, [clearTimer, personalBest])

  const handleAnswer = useCallback((optionIndex: number) => {
    if (selected !== null) return
    clearTimer()
    setSelected(optionIndex)

    const q = questions[questionIndex]
    const isCorrect = optionIndex === q.answer
    const elapsed = (Date.now() - questionStartRef.current) / 1000
    const speedBonus = isCorrect
      ? Math.round(TRIVIA_CONFIG.speedBonus * (1 - elapsed / TRIVIA_CONFIG.timePerQuestion))
      : 0
    const points = isCorrect ? TRIVIA_CONFIG.basePoints + speedBonus : 0

    setScore((prev) => {
      const newScore = prev + points
      setStreak((s) => {
        const newStreak = isCorrect ? s + 1 : 0
        return newStreak
      })
      if (isCorrect) setCorrect((c) => c + 1)
      // Move to next question after 1.2s
      setTimeout(() => nextQuestion(questionIndex, newScore), 1200)
      return newScore
    })
  }, [selected, questions, questionIndex, clearTimer, nextQuestion])

  // Timer countdown while playing
  useEffect(() => {
    if (gameState !== 'PLAYING' || selected !== null) return
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timerRef.current!)
          handleAnswer(-1) // timeout = wrong
          return 0
        }
        return t - 1
      })
    }, 1000)
    return () => clearTimer()
  }, [gameState, questionIndex, selected, handleAnswer, clearTimer])

  const startGame = () => {
    setQuestions(shuffle(TRIVIA_QUESTIONS).slice(0, TRIVIA_CONFIG.totalQuestions))
    setQuestionIndex(0)
    setScore(0)
    setSelected(null)
    setTimeLeft(TRIVIA_CONFIG.timePerQuestion)
    setStreak(0)
    setCorrect(0)
    questionStartRef.current = Date.now()
    sdkRef.current?.onStart()
    setGameState('PLAYING')
  }

  const q = questions[questionIndex]

  // ── TITLE ──────────────────────────────────────────────────────────────────
  if (gameState === 'TITLE') {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-[#0A0A0A] px-6 text-center select-none">
        <div className="text-6xl mb-4">🧠</div>
        <h1 className="text-5xl text-white mb-2" style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.04em' }}>
          TWIN TRIVIA
        </h1>
        <p className="text-[#999] mb-2">How well do you know Alex &amp; Alan?</p>
        <p className="text-[#666] text-sm mb-8">{TRIVIA_CONFIG.totalQuestions} questions · {TRIVIA_CONFIG.timePerQuestion}s each</p>
        {personalBest > 0 && (
          <p className="text-[#FF3D00] text-sm mb-6" style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.05em' }}>
            YOUR BEST: {personalBest}
          </p>
        )}
        <button
          onClick={startGame}
          className="px-10 py-4 bg-[#FF3D00] hover:bg-[#CC3100] text-white rounded-xl text-lg transition-all active:scale-95"
          style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.08em' }}
        >
          START QUIZ
        </button>
      </div>
    )
  }

  // ── SCORE SCREEN ───────────────────────────────────────────────────────────
  if (gameState === 'SCORE_SCREEN') {
    const isNewBest = score > personalBest
    const pct = Math.round((correct / TRIVIA_CONFIG.totalQuestions) * 100)
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-[#0A0A0A] px-6 text-center select-none">
        <div className="text-5xl mb-4">
          {pct >= 90 ? '🏆' : pct >= 70 ? '🥇' : pct >= 50 ? '🥈' : '🎮'}
        </div>
        {isNewBest && (
          <div className="text-[#FFD700] text-sm mb-2 animate-bounce" style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.08em' }}>
            ⭐ NEW BEST! ⭐
          </div>
        )}
        <h2 className="text-4xl text-white mb-1" style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.04em' }}>
          FINAL SCORE
        </h2>
        <p className="text-6xl font-bold mb-2" style={{ color: '#FF3D00', fontFamily: 'var(--font-display)' }}>
          {score}
        </p>
        <p className="text-[#999] mb-6">
          {correct}/{TRIVIA_CONFIG.totalQuestions} correct · {pct}%
        </p>
        <div className="flex gap-3">
          <button
            onClick={startGame}
            className="px-6 py-3 bg-[#FF3D00] hover:bg-[#CC3100] text-white rounded-xl transition-all active:scale-95"
            style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.06em' }}
          >
            PLAY AGAIN
          </button>
          <button
            onClick={() => sdkRef.current?.showLeaderboard()}
            className="px-6 py-3 border border-[#1E1E1E] hover:border-[#FF3D00] text-[#999] hover:text-white rounded-xl transition-all active:scale-95"
            style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.06em' }}
          >
            LEADERBOARD
          </button>
        </div>
      </div>
    )
  }

  // ── PLAYING ────────────────────────────────────────────────────────────────
  const timerPct = (timeLeft / TRIVIA_CONFIG.timePerQuestion) * 100
  const timerColor = timerPct > 50 ? '#00FF94' : timerPct > 25 ? '#FFD700' : '#FF3D00'

  return (
    <div className="w-full h-full flex flex-col bg-[#0A0A0A] select-none overflow-hidden" style={{ touchAction: 'none' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#1E1E1E]">
        <div>
          <span className="text-[#666] text-xs" style={{ fontFamily: 'var(--font-display)' }}>
            Q {questionIndex + 1}/{TRIVIA_CONFIG.totalQuestions}
          </span>
          {streak >= 2 && (
            <span className="ml-2 text-[#FF3D00] text-xs" style={{ fontFamily: 'var(--font-display)' }}>
              🔥 ×{streak}
            </span>
          )}
        </div>
        <span className="text-white text-lg" style={{ fontFamily: 'var(--font-display)' }}>{score}</span>
        <div className="flex items-center gap-1.5">
          <span style={{ color: timerColor, fontFamily: 'var(--font-display)', fontSize: '1.1rem' }}>{timeLeft}s</span>
        </div>
      </div>

      {/* Timer bar */}
      <div className="h-1 bg-[#111]">
        <div
          className="h-full transition-all duration-1000"
          style={{ width: `${timerPct}%`, background: timerColor }}
        />
      </div>

      {/* Question */}
      <div className="flex-1 flex flex-col px-4 py-6 overflow-auto">
        <div className="bg-[#111] border border-[#1E1E1E] rounded-xl p-5 mb-6">
          <p className="text-white text-lg leading-snug text-center">
            {q.question}
          </p>
        </div>

        {/* Options */}
        <div className="grid grid-cols-1 gap-3">
          {q.options.map((opt, i) => {
            let style = 'border-[#1E1E1E] text-[#999] hover:border-[#FF3D00] hover:text-white'
            if (selected !== null) {
              if (i === q.answer) style = 'border-[#00FF94] bg-[#00FF94]/10 text-[#00FF94]'
              else if (i === selected && selected !== q.answer) style = 'border-[#FF3D00] bg-[#FF3D00]/10 text-[#FF3D00]'
              else style = 'border-[#1E1E1E] text-[#444]'
            }
            return (
              <button
                key={i}
                onClick={() => handleAnswer(i)}
                disabled={selected !== null}
                className={`w-full px-4 py-3.5 border rounded-xl text-left text-sm transition-all active:scale-[0.98] ${style}`}
              >
                <span className="mr-3 text-[#555]" style={{ fontFamily: 'var(--font-display)' }}>
                  {['A', 'B', 'C', 'D'][i]}
                </span>
                {opt}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

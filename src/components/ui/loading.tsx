'use client'

import { useEffect, useState, useRef } from 'react'

const MESSAGES = [
  'Getting your chit details',
  'Loading member records',
  'Counting contributions',
  'Preparing your ledger',
  'Fetching fund data',
]

const COINS = [
  { width: 52, color: '#d4a843' },
  { width: 49, color: '#c9a227' },
  { width: 46, color: '#1b4332' },
  { width: 43, color: '#d4a843' },
  { width: 40, color: '#2d6a4f' },
]

interface LoadingProps {
  message?: string
  fullPage?: boolean
}

export function Loading({ message, fullPage = false }: LoadingProps) {
  const [msgIndex, setMsgIndex] = useState(0)
  const [dots, setDots] = useState('.')
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    setVisible(true)
  }, [])

  useEffect(() => {
    if (message) return
    const t = setInterval(() => {
      setMsgIndex(i => (i + 1) % MESSAGES.length)
    }, 2200)
    return () => clearInterval(t)
  }, [message])

  useEffect(() => {
    const states = ['.', '..', '...', '']
    let i = 0
    const t = setInterval(() => {
      i = (i + 1) % states.length
      setDots(states[i])
    }, 400)
    return () => clearInterval(t)
  }, [])

  const inner = (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '64px 24px',
    }}>
      {/* Keyframes injected once */}
      <style>{`
        @keyframes cm-breath {
          0%,100% { opacity:1; transform:scale(1); }
          50%      { opacity:0.5; transform:scale(0.88); }
        }
        @keyframes cm-coin {
          0%   { opacity:0; transform:translateY(-18px) scaleX(0.8); }
          65%  { transform:translateY(3px) scaleX(1.04); }
          100% { opacity:1; transform:translateY(0) scaleX(1); }
        }
        @keyframes cm-fade {
          from { opacity:0; }
          to   { opacity:1; }
        }
      `}</style>

      {/* Rupee symbol */}
      <div style={{
        fontFamily: "'Playfair Display', Georgia, serif",
        fontSize: '2.8rem',
        fontWeight: 700,
        color: '#1b4332',
        marginBottom: '14px',
        animation: 'cm-breath 1.6s ease-in-out infinite',
      }}>
        ₹
      </div>

      {/* Coin stack */}
      <div style={{
        display: 'flex',
        flexDirection: 'column-reverse',
        alignItems: 'center',
        gap: '3px',
        marginBottom: '24px',
      }}>
        {COINS.map((coin, i) => (
          <div
            key={i}
            style={{
              width: coin.width,
              height: 10,
              borderRadius: '50%',
              background: coin.color,
              boxShadow: '0 2px 5px rgba(0,0,0,0.15)',
              opacity: 0,
              animation: `cm-coin 0.45s ease-out ${i * 0.13}s forwards`,
            }}
          />
        ))}
      </div>

      {/* Message */}
      <div style={{
        fontSize: '0.8125rem',
        color: '#717973',
        letterSpacing: '0.01em',
        animation: 'cm-fade 0.3s ease',
      }}>
        {message || MESSAGES[msgIndex]}
        <span style={{ display: 'inline-block', width: 20 }}>
          {dots}
        </span>
      </div>
    </div>
  )

  if (fullPage) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#fbf9f6',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        {inner}
      </div>
    )
  }

  // Inline centered — for use inside a content area
  return (
    <div style={{
      width: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '320px',
    }}>
      {inner}
    </div>
  )
}

// Skeleton card for stat areas
export function StatCardSkeleton() {
  return (
    <div style={{
      background: '#ffffff',
      borderRadius: 8,
      padding: 24,
      boxShadow: '0 4px 24px rgba(27,28,26,0.06)',
    }}>
      <style>{`
        @keyframes cm-shimmer {
          0%,100%{opacity:1} 50%{opacity:0.4}
        }
      `}</style>
      <div style={{
        height: 11, width: '55%', background: '#f5f3f0',
        borderRadius: 4, marginBottom: 16,
        animation: 'cm-shimmer 1.8s ease-in-out infinite',
      }} />
      <div style={{
        height: 32, width: '38%', background: '#eeece9',
        borderRadius: 4,
        animation: 'cm-shimmer 1.8s ease-in-out infinite 0.2s',
      }} />
    </div>
  )
}

// Skeleton row for member lists
export function MemberRowSkeleton() {
  return (
    <div style={{
      display: 'flex', alignItems: 'center',
      gap: 12, padding: '14px 16px',
    }}>
      <style>{`
        @keyframes cm-shimmer {
          0%,100%{opacity:1} 50%{opacity:0.4}
        }
      `}</style>
      <div style={{
        width: 40, height: 40, borderRadius: '50%',
        background: '#eeece9', flexShrink: 0,
        animation: 'cm-shimmer 1.8s ease-in-out infinite',
      }} />
      <div style={{ flex: 1 }}>
        <div style={{
          height: 13, width: '38%', background: '#f5f3f0',
          borderRadius: 4, marginBottom: 8,
          animation: 'cm-shimmer 1.8s ease-in-out infinite 0.1s',
        }} />
        <div style={{
          height: 11, width: '26%', background: '#f5f3f0',
          borderRadius: 4,
          animation: 'cm-shimmer 1.8s ease-in-out infinite 0.2s',
        }} />
      </div>
      <div style={{
        height: 13, width: 64, background: '#eeece9',
        borderRadius: 4,
        animation: 'cm-shimmer 1.8s ease-in-out infinite 0.15s',
      }} />
    </div>
  )
}

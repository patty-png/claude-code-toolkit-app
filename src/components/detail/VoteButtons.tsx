'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { voteOnTool } from '@/app/explore/[slug]/actions'

export function VoteButtons({
  toolId,
  initialUpvotes,
  initialDownvotes,
  initialUserVote,
}: {
  toolId: number
  initialUpvotes: number
  initialDownvotes: number
  initialUserVote: number | null
}) {
  const router = useRouter()
  const [upvotes, setUpvotes] = useState(initialUpvotes)
  const [downvotes, setDownvotes] = useState(initialDownvotes)
  const [userVote, setUserVote] = useState<number | null>(initialUserVote)
  const [error, setError] = useState<string | null>(null)
  const [, startTransition] = useTransition()

  const score = upvotes - downvotes

  const vote = (value: 1 | -1) => {
    setError(null)
    const prevVote = userVote
    const prevUp = upvotes
    const prevDown = downvotes

    // Optimistic
    if (prevVote === value) {
      // Unvote
      setUserVote(null)
      if (value === 1) setUpvotes(upvotes - 1)
      else setDownvotes(downvotes - 1)
    } else if (prevVote === null) {
      setUserVote(value)
      if (value === 1) setUpvotes(upvotes + 1)
      else setDownvotes(downvotes + 1)
    } else {
      setUserVote(value)
      if (value === 1) { setUpvotes(upvotes + 1); setDownvotes(downvotes - 1) }
      else { setUpvotes(upvotes - 1); setDownvotes(downvotes + 1) }
    }

    startTransition(async () => {
      const res = await voteOnTool(toolId, value)
      if (!res.ok) {
        // Revert
        setUserVote(prevVote)
        setUpvotes(prevUp)
        setDownvotes(prevDown)
        if (res.error === 'not_authenticated') {
          router.push('/auth/sign-in')
          return
        }
        setError('Vote failed')
      }
    })
  }

  return (
    <div className="vote-cluster" role="group" aria-label="Vote">
      <button
        type="button"
        className={`vote-btn ${userVote === 1 ? 'active' : ''}`}
        onClick={() => vote(1)}
        aria-label="Upvote"
      >
        ▲
      </button>
      <div className="vote-score" aria-live="polite">{score}</div>
      <button
        type="button"
        className={`vote-btn vote-down ${userVote === -1 ? 'active' : ''}`}
        onClick={() => vote(-1)}
        aria-label="Downvote"
      >
        ▼
      </button>
      {error && <div className="vote-error">{error}</div>}
    </div>
  )
}

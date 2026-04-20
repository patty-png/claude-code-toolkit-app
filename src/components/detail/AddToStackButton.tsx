'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { addToStackFromDetail } from '@/app/explore/[slug]/actions'

export function AddToStackButton({ toolId }: { toolId: number }) {
  const router = useRouter()
  const [state, setState] = useState<'idle' | 'added' | 'already'>('idle')
  const [, startTransition] = useTransition()

  const add = () => {
    startTransition(async () => {
      const res = await addToStackFromDetail(toolId)
      if (!res.ok) {
        if (res.error === 'not_authenticated') router.push('/auth/sign-in')
        return
      }
      setState(res.already ? 'already' : 'added')
      setTimeout(() => setState('idle'), 2400)
    })
  }

  return (
    <button type="button" className="add-to-stack" onClick={add}>
      {state === 'added' ? '✓ Added to stack' : state === 'already' ? '✓ Already in stack' : '+ Add to stack'}
    </button>
  )
}

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { subscribe } from '@/lib/beehiiv'

const bodySchema = z.object({
  email: z.string().email(),
  source: z.string().max(64).optional(),
})

export async function POST(req: NextRequest) {
  let json: unknown
  try {
    json = await req.json()
  } catch {
    return NextResponse.json({ ok: false, error: 'invalid-json' }, { status: 400 })
  }

  const parsed = bodySchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: 'invalid-input' }, { status: 400 })
  }

  const { email, source } = parsed.data

  const result = await subscribe({
    email,
    utmSource: source ?? 'toolkit-footer',
    utmMedium: 'site',
    referringSite: req.headers.get('referer') ?? undefined,
  })

  if (!result.ok) {
    const status = result.status && result.status >= 400 && result.status < 500 ? 400 : 500
    return NextResponse.json({ ok: false, error: result.error }, { status })
  }

  return NextResponse.json({ ok: true })
}

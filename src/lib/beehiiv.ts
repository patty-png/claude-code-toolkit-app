const BEEHIIV_API_BASE = 'https://api.beehiiv.com/v2'

type SubscribeParams = {
  email: string
  utmSource?: string
  utmMedium?: string
  utmCampaign?: string
  referringSite?: string
  sendWelcomeEmail?: boolean
}

export type BeehiivSubscribeResult =
  | { ok: true; id: string }
  | { ok: false; error: string; status?: number }

export async function subscribe(params: SubscribeParams): Promise<BeehiivSubscribeResult> {
  const apiKey = process.env.BEEHIIV_API_KEY
  const publicationId = process.env.BEEHIIV_PUBLICATION_ID

  if (!apiKey || !publicationId) {
    return { ok: false, error: 'beehiiv-not-configured' }
  }

  const body = {
    email: params.email,
    send_welcome_email: params.sendWelcomeEmail ?? true,
    utm_source: params.utmSource,
    utm_medium: params.utmMedium,
    utm_campaign: params.utmCampaign,
    referring_site: params.referringSite,
    reactivate_existing: true,
  }

  try {
    const res = await fetch(
      `${BEEHIIV_API_BASE}/publications/${publicationId}/subscriptions`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      }
    )

    if (!res.ok) {
      const text = await res.text().catch(() => '')
      return { ok: false, error: text || res.statusText, status: res.status }
    }

    const data = await res.json()
    return { ok: true, id: data?.data?.id ?? '' }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'unknown' }
  }
}

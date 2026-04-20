// Ported from v18 — expand search queries to related terms
export const SYNONYMS: Record<string, string[]> = {
  voice: ['audio', 'speech', 'tts', 'stt', 'whisper', 'transcript', 'podcast'],
  audio: ['voice', 'sound', 'music', 'podcast'],
  video: ['youtube', 'transcript', 'runway', 'pika', 'luma', 'higgsfield', 'heygen', 'synthesia'],
  image: ['picture', 'vision', 'visual', 'design', 'figma', 'midjourney', 'flux', 'krea', 'ideogram'],
  music: ['suno', 'udio', 'audio', 'sound'],
  '3d': ['meshy', 'spline', 'luma', 'blender'],
  model: ['3d', 'meshy', 'spline', 'hugging face', 'replicate'],
  gateway: ['openrouter', 'portkey', 'helicone'],
  inference: ['groq', 'together', 'replicate', 'fireworks', 'modal'],
  llm: ['chatgpt', 'claude.ai', 'gemini', 'openrouter', 'groq'],
  backend: ['firebase', 'supabase', 'neon', 'planetscale', 'upstash'],
  serverless: ['neon', 'planetscale', 'upstash', 'modal', 'vercel', 'firebase'],
  builder: ['v0', 'lovable', 'bolt', 'replit', 'framer'],
  diagram: ['drawio', 'draw.io', 'diagrams.net', 'excalidraw'],
  database: ['postgres', 'supabase', 'neon', 'planetscale', 'mongo'],
  auth: ['clerk', 'auth0', 'supabase', 'firebase'],
  payment: ['stripe', 'paddle', 'lemon'],
  analytics: ['posthog', 'amplitude', 'mixpanel'],
  design: ['figma', 'framer', 'sketch'],
  monitor: ['sentry', 'datadog', 'posthog', 'grafana'],
  deploy: ['vercel', 'netlify', 'railway', 'fly'],
}

export function expandQuery(q: string): string {
  const terms = q.toLowerCase().trim().split(/\s+/).filter(Boolean)
  const expanded = new Set(terms)
  for (const t of terms) {
    SYNONYMS[t]?.forEach(s => expanded.add(s))
  }
  return [...expanded].join(' | ')
}

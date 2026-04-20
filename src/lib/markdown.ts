import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkGfm from 'remark-gfm'
import remarkRehype from 'remark-rehype'
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize'
import rehypeHighlight from 'rehype-highlight'
import rehypeStringify from 'rehype-stringify'
import type { Schema } from 'hast-util-sanitize'

const schema: Schema = {
  ...defaultSchema,
  attributes: {
    ...(defaultSchema.attributes as Record<string, Array<string | [string, ...(string | number | boolean)[]]>>),
    code: [...((defaultSchema.attributes?.code as any[]) ?? []), 'className'],
    span: [...((defaultSchema.attributes?.span as any[]) ?? []), 'className'],
    a: [...((defaultSchema.attributes?.a as any[]) ?? []), 'target', 'rel'],
  },
}

export async function renderMarkdown(md: string): Promise<string> {
  if (!md) return ''
  try {
    const file = await unified()
      .use(remarkParse)
      .use(remarkGfm)
      .use(remarkRehype, { allowDangerousHtml: false })
      .use(rehypeSanitize, schema)
      .use(rehypeHighlight, { detect: true, ignoreMissing: true })
      .use(rehypeStringify)
      .process(md)
    return String(file)
  } catch {
    return ''
  }
}

// Strip markdown down to plain text for meta descriptions / OG
export function stripMarkdown(md: string, max = 160): string {
  if (!md) return ''
  const plain = md
    .replace(/```[\s\S]*?```/g, '')      // code fences
    .replace(/`[^`]+`/g, '')              // inline code
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '') // images
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1') // links → text
    .replace(/[#*_~>]/g, '')              // markdown glyphs
    .replace(/\s+/g, ' ')
    .trim()
  return plain.length > max ? plain.slice(0, max - 1) + '…' : plain
}

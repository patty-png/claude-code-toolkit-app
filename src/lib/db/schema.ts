import { pgTable, text, bigserial, bigint, integer, boolean, timestamp, jsonb, uuid, numeric, date, primaryKey, index } from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'

export const categories = pgTable('categories', {
  id: text('id').primaryKey(),
  label: text('label').notNull(),
  shortLabel: text('short_label'),
  emoji: text('emoji'),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
})

export const tools = pgTable('tools', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  slug: text('slug').notNull().unique(),
  name: text('name').notNull(),
  categoryId: text('category_id').references(() => categories.id, { onDelete: 'set null' }),
  tag: text('tag'),
  blurb: text('blurb').notNull(),
  url: text('url'),
  installCommand: text('install_command'),
  installNotes: text('install_notes'),
  isFeatured: boolean('is_featured').default(false),
  featureRank: integer('feature_rank'),
  // ── Phase 6 additions ──
  githubUrl: text('github_url'),
  githubStars: integer('github_stars').default(0),
  githubForks: integer('github_forks').default(0),
  githubLastCommit: timestamp('github_last_commit', { withTimezone: true }),
  license: text('license'),
  primaryLanguage: text('primary_language'),
  publisher: text('publisher'),
  repoName: text('repo_name'),
  installsCount: integer('installs_count').default(0),
  upvotes: integer('upvotes').default(0),
  downvotes: integer('downvotes').default(0),
  readmeMd: text('readme_md'),
  skillMd: text('skill_md'),
  claudeMd: text('claude_md'),
  source: text('source'),
  identityKey: text('identity_key'),
  enrichedAt: timestamp('enriched_at', { withTimezone: true }),
  lastSeenAt: timestamp('last_seen_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (t) => ({
  categoryIdx: index('tools_category_idx').on(t.categoryId),
  featuredIdx: index('tools_featured_lookup_idx').on(t.isFeatured),
  starsIdx: index('tools_stars_lookup_idx').on(t.githubStars),
  publisherIdx: index('tools_publisher_lookup_idx').on(t.publisher),
}))

export const stagingTools = pgTable('staging_tools', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  identityKey: text('identity_key').notNull(),
  name: text('name').notNull(),
  categoryHint: text('category_hint'),
  tag: text('tag'),
  blurb: text('blurb'),
  url: text('url'),
  githubUrl: text('github_url'),
  installCommand: text('install_command'),
  publisher: text('publisher'),
  repoName: text('repo_name'),
  source: text('source').notNull(),
  raw: jsonb('raw'),
  status: text('status').default('pending'),
  reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
  reviewedBy: uuid('reviewed_by'),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
})

export const toolVotes = pgTable('tool_votes', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  toolId: bigint('tool_id', { mode: 'number' }).references(() => tools.id, { onDelete: 'cascade' }).notNull(),
  userId: uuid('user_id').notNull(),
  value: integer('value').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
})

export const toolComments = pgTable('tool_comments', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  toolId: bigint('tool_id', { mode: 'number' }).references(() => tools.id, { onDelete: 'cascade' }).notNull(),
  userId: uuid('user_id').notNull(),
  body: text('body').notNull(),
  parentId: uuid('parent_id'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
})

export const tags = pgTable('tags', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  name: text('name').notNull().unique(),
})

export const toolTags = pgTable('tool_tags', {
  toolId: bigint('tool_id', { mode: 'number' }).references(() => tools.id, { onDelete: 'cascade' }),
  tagId: bigint('tag_id', { mode: 'number' }).references(() => tags.id, { onDelete: 'cascade' }),
}, (t) => ({
  pk: primaryKey({ columns: [t.toolId, t.tagId] }),
}))

export const videos = pgTable('videos', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  title: text('title').notNull(),
  url: text('url').notNull(),
  youtubeId: text('youtube_id'),
  thumbnailUrl: text('thumbnail_url'),
  channel: text('channel'),
  durationSeconds: integer('duration_seconds'),
  topic: text('topic'),
  skillLevel: text('skill_level'),
  description: text('description'),
  publishedAt: date('published_at'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
})

export const courses = pgTable('courses', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  title: text('title').notNull(),
  provider: text('provider').notNull(),
  url: text('url').notNull(),
  priceUsd: numeric('price_usd'),
  isFree: boolean('is_free').default(false),
  hasCertificate: boolean('has_certificate').default(false),
  skillLevel: text('skill_level'),
  durationHours: numeric('duration_hours'),
  description: text('description'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
})

export const profiles = pgTable('profiles', {
  id: uuid('id').primaryKey(),
  username: text('username').unique(),
  displayName: text('display_name'),
  avatarUrl: text('avatar_url'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
})

export const projects = pgTable('projects', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid('user_id').notNull(),
  name: text('name').notNull(),
  description: text('description'),
  sortOrder: integer('sort_order').default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
})

export const stackItems = pgTable('stack_items', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  projectId: uuid('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  toolId: bigint('tool_id', { mode: 'number' }).references(() => tools.id, { onDelete: 'cascade' }),
  customToolName: text('custom_tool_name'),
  customToolUrl: text('custom_tool_url'),
  fields: jsonb('fields').default(sql`'{}'::jsonb`),
  addedAt: timestamp('added_at', { withTimezone: true }).defaultNow(),
})

export type Tool = typeof tools.$inferSelect
export type Category = typeof categories.$inferSelect
export type Video = typeof videos.$inferSelect
export type Course = typeof courses.$inferSelect
export type Project = typeof projects.$inferSelect
export type StackItem = typeof stackItems.$inferSelect

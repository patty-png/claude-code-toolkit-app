'use client'

import { useMemo, useState } from 'react'

type Resource = {
  id: number
  resource_type: string        // 'video' | 'doc' | 'research' | 'blog'
  source_type: string          // 'anthropic_official' | 'creator' | 'research_lab' | ...
  source_name: string | null
  source_handle: string | null
  source_url: string | null
  title: string
  url: string
  description: string | null
  thumbnail_url: string | null
  youtube_id: string | null
  duration_min: number | null
  skill_level: string | null
  topic: string | null
  is_featured: boolean | null
}

type Course = {
  id: number
  title: string
  provider: string
  url: string
  price_usd: string | null
  is_free: boolean | null
  has_certificate: boolean | null
  skill_level: string | null
  duration_hours: string | null
  description: string | null
}

type Tab = 'overview' | 'anthropic' | 'creators' | 'videos' | 'courses' | 'research' | 'roadmap'

export function LearnTabs({ resources, courses }: { resources: Resource[]; courses: Course[] }) {
  const [tab, setTab] = useState<Tab>('overview')

  const anthropic = useMemo(() => resources.filter(r => r.source_type === 'anthropic_official'), [resources])
  const creators = useMemo(() => resources.filter(r => r.source_type === 'creator'), [resources])
  const allVideos = useMemo(() => resources.filter(r => r.resource_type === 'video'), [resources])
  const research = useMemo(() => resources.filter(r => r.resource_type === 'research' || r.source_type === 'research_lab'), [resources])
  const featured = useMemo(() => resources.filter(r => r.is_featured).slice(0, 6), [resources])
  const freeCourses = useMemo(() => courses.filter(c => c.is_free), [courses])

  const TABS: { key: Tab; label: string; count?: number }[] = [
    { key: 'overview', label: 'Overview' },
    { key: 'anthropic', label: 'Anthropic', count: anthropic.length },
    { key: 'creators', label: 'Creators', count: creators.length },
    { key: 'videos', label: 'Videos', count: allVideos.length },
    { key: 'courses', label: 'Free Courses', count: freeCourses.length },
    { key: 'research', label: 'Research', count: research.length },
    { key: 'roadmap', label: 'Roadmap' },
  ]

  return (
    <>
      <div className="chips" style={{ marginBottom: 28 }}>
        {TABS.map((t) => (
          <button
            key={t.key}
            className={`chip ${tab === t.key ? 'active' : ''}`}
            onClick={() => setTab(t.key)}
            type="button"
          >
            {t.label}{t.count !== undefined && <> · {t.count}</>}
          </button>
        ))}
      </div>

      {tab === 'overview' && <Overview featured={featured} resources={resources} />}
      {tab === 'anthropic' && <AnthropicSection items={anthropic} />}
      {tab === 'creators' && <CreatorsSection items={creators} />}
      {tab === 'videos' && <VideoGrid items={allVideos} />}
      {tab === 'courses' && <CourseGrid courses={freeCourses} />}
      {tab === 'research' && <ResearchSection items={research} />}
      {tab === 'roadmap' && <Roadmap />}
    </>
  )
}

/* ───────────────── OVERVIEW ───────────────── */
function Overview({ featured, resources }: { featured: Resource[]; resources: Resource[] }) {
  const anthropicCount = resources.filter(r => r.source_type === 'anthropic_official').length
  const creatorNames = new Set(resources.filter(r => r.source_type === 'creator').map(r => r.source_name))

  return (
    <>
      {featured.length > 0 && (
        <section style={{ marginBottom: 48 }}>
          <div className="section-head">
            <div className="section-num">Start here</div>
            <h2 className="serif">Hand-picked <em>must-watches.</em></h2>
          </div>
          <div className="video-grid">
            {featured.map((v) => <ResourceCard key={v.id} r={v} />)}
          </div>
        </section>
      )}
      <div className="learn-overview-stats">
        <div><strong>{anthropicCount}</strong> Anthropic official</div>
        <div><strong>{creatorNames.size}</strong> creators</div>
        <div><strong>{resources.length}</strong> total resources</div>
      </div>
    </>
  )
}

/* ───────────────── ANTHROPIC ───────────────── */
function AnthropicSection({ items }: { items: Resource[] }) {
  const videos = items.filter(i => i.resource_type === 'video')
  const docs = items.filter(i => i.resource_type === 'doc')
  const blog = items.filter(i => i.resource_type === 'blog' || i.resource_type === 'research')
  return (
    <>
      <div className="anthropic-hero">
        <div className="anthropic-avatar" aria-hidden="true">A</div>
        <div>
          <h3>From Anthropic — the team behind Claude</h3>
          <p>Official videos, documentation, and research straight from the source.</p>
        </div>
      </div>

      {videos.length > 0 && (
        <section style={{ marginBottom: 40 }}>
          <h3 className="learn-subhead">Videos</h3>
          <div className="video-grid">{videos.map((v) => <ResourceCard key={v.id} r={v} />)}</div>
        </section>
      )}

      {docs.length > 0 && (
        <section style={{ marginBottom: 40 }}>
          <h3 className="learn-subhead">Documentation</h3>
          <div className="doc-grid">{docs.map((d) => <DocRow key={d.id} r={d} />)}</div>
        </section>
      )}

      {blog.length > 0 && (
        <section>
          <h3 className="learn-subhead">Blog & Research</h3>
          <div className="doc-grid">{blog.map((d) => <DocRow key={d.id} r={d} />)}</div>
        </section>
      )}
    </>
  )
}

/* ───────────────── CREATORS ───────────────── */
function CreatorsSection({ items }: { items: Resource[] }) {
  // Group by source_name
  const grouped: Record<string, Resource[]> = {}
  items.forEach(r => {
    const key = r.source_name ?? 'Unknown'
    grouped[key] = grouped[key] ?? []
    grouped[key].push(r)
  })
  const creators = Object.entries(grouped).sort((a, b) => b[1].length - a[1].length)

  return (
    <>
      <div className="creators-intro">
        <h3 className="serif">Learn from the <em>builders shipping with Claude Code.</em></h3>
        <p>YouTubers, streamers, and engineers creating tutorials on real-world Claude Code workflows.</p>
      </div>
      {creators.map(([name, videos]) => {
        const handle = videos[0].source_handle
        const channel = videos[0].source_url
        return (
          <section key={name} className="creator-section">
            <div className="creator-header">
              <div className="creator-avatar" aria-hidden="true">{name.slice(0, 1)}</div>
              <div className="creator-id">
                <h3>{name}</h3>
                <div className="creator-meta">
                  {handle && <span>{handle}</span>}
                  {channel && <a href={channel} target="_blank" rel="noopener noreferrer" className="creator-channel">Channel ↗</a>}
                </div>
              </div>
              <div className="creator-count">{videos.length} video{videos.length === 1 ? '' : 's'}</div>
            </div>
            <div className="video-grid">
              {videos.map((v) => <ResourceCard key={v.id} r={v} />)}
            </div>
          </section>
        )
      })}
    </>
  )
}

/* ───────────────── VIDEOS (all) ───────────────── */
function VideoGrid({ items }: { items: Resource[] }) {
  return <div className="video-grid">{items.map((v) => <ResourceCard key={v.id} r={v} />)}</div>
}

/* ───────────────── COURSES ───────────────── */
function CourseGrid({ courses }: { courses: Course[] }) {
  return (
    <div className="course-grid">
      {courses.map((c) => (
        <a key={c.id} href={c.url} target="_blank" rel="noopener noreferrer" className="course-card">
          <div className="course-head">
            <div className="course-provider">{c.provider}</div>
            <div className="course-badges">
              {c.is_free ? <span className="badge free">Free</span> : <span className="badge paid">${c.price_usd}</span>}
              {c.has_certificate && <span className="badge cert">Cert</span>}
            </div>
          </div>
          <h3 className="course-title">{c.title}</h3>
          {c.description && <p className="course-desc">{c.description}</p>}
          <div className="course-foot">
            {c.skill_level && <span>{c.skill_level}</span>}
            {c.duration_hours && <span>· {c.duration_hours}h</span>}
          </div>
        </a>
      ))}
    </div>
  )
}

/* ───────────────── RESEARCH ───────────────── */
function ResearchSection({ items }: { items: Resource[] }) {
  return (
    <>
      <div className="creators-intro">
        <h3 className="serif">Research, papers & deep dives.</h3>
        <p>Foundational papers, design retrospectives, and long-form writeups on Claude Code.</p>
      </div>
      <div className="doc-grid">
        {items.map((r) => <DocRow key={r.id} r={r} />)}
      </div>
    </>
  )
}

/* ───────────────── Shared cards ───────────────── */
function ResourceCard({ r }: { r: Resource }) {
  return (
    <a href={r.url} target="_blank" rel="noopener noreferrer" className="video-card">
      {r.thumbnail_url && (
        <div className="video-thumb">
          <img src={r.thumbnail_url} alt="" loading="lazy" />
          <span className="video-play">▶</span>
        </div>
      )}
      <div className="video-body">
        <div className="video-meta">
          {r.source_name && <span>{r.source_name}</span>}
          {r.skill_level && <span className="video-level">{r.skill_level}</span>}
          {r.duration_min && <span>{r.duration_min}m</span>}
        </div>
        <h3 className="video-title">{r.title}</h3>
        {r.description && <p className="video-desc">{r.description}</p>}
      </div>
    </a>
  )
}

function DocRow({ r }: { r: Resource }) {
  return (
    <a href={r.url} target="_blank" rel="noopener noreferrer" className="doc-row">
      <div className="doc-row-body">
        <h4>{r.title}</h4>
        {r.description && <p>{r.description}</p>}
      </div>
      <div className="doc-row-meta">
        {r.topic && <span className="chip-mini">{r.topic}</span>}
        <span className="doc-row-arrow">↗</span>
      </div>
    </a>
  )
}

/* ───────────────── ROADMAP (unchanged) ───────────────── */
type TaskResource = { type: 'video' | 'doc' | 'course'; url: string; label: string }
type Task = { text: string; resources?: TaskResource[] }

function Roadmap() {
  const phases: { num: string; title: string; duration: string; tasks: Task[] }[] = [
    {
      num: '01', title: 'Foundation', duration: 'Days 1–3',
      tasks: [
        { text: 'Install Claude Code CLI, verify first chat', resources: [
          { type: 'doc', url: 'https://docs.claude.com/en/docs/claude-code/quickstart', label: 'Quickstart' },
          { type: 'video', url: 'https://www.youtube.com/watch?v=AJpK3YTTKZ4', label: 'Intro video' },
        ]},
        { text: 'Write your first CLAUDE.md', resources: [
          { type: 'doc', url: 'https://docs.claude.com/en/docs/claude-code/memory', label: 'Memory docs' },
          { type: 'video', url: 'https://www.youtube.com/watch?v=mdMQdNaJU2w', label: 'CLAUDE.md deep dive' },
        ]},
        { text: 'Add Filesystem + GitHub MCPs', resources: [
          { type: 'doc', url: 'https://docs.claude.com/en/docs/claude-code/mcp', label: 'MCP docs' },
        ]},
        { text: 'Complete the official quickstart', resources: [
          { type: 'course', url: 'https://docs.claude.com/en/docs/claude-code/tutorials', label: 'Tutorials' },
        ]},
      ],
    },
    {
      num: '02', title: 'Customization', duration: 'Days 4–7',
      tasks: [
        { text: 'Create your first /skill', resources: [
          { type: 'doc', url: 'https://docs.claude.com/en/docs/claude-code/skills', label: 'Skills docs' },
        ]},
        { text: 'Add 2 category-specific MCPs', resources: [
          { type: 'doc', url: 'https://github.com/modelcontextprotocol/servers', label: 'Official servers' },
        ]},
        { text: 'Configure a pre-tool-use hook', resources: [
          { type: 'doc', url: 'https://docs.claude.com/en/docs/claude-code/hooks', label: 'Hooks docs' },
        ]},
        { text: 'Set up subagents', resources: [
          { type: 'doc', url: 'https://docs.claude.com/en/docs/claude-code/sub-agents', label: 'Subagents docs' },
        ]},
      ],
    },
    {
      num: '03', title: 'Scale', duration: 'Week 2',
      tasks: [
        { text: 'Build a custom MCP server', resources: [
          { type: 'course', url: 'https://www.deeplearning.ai/short-courses/building-agents-with-model-context-protocol/', label: 'DeepLearning.AI course' },
          { type: 'doc', url: 'https://modelcontextprotocol.io/docs/tutorials/building-mcp-with-llms', label: 'Build-your-own guide' },
        ]},
        { text: 'Install a plugin marketplace', resources: [
          { type: 'doc', url: 'https://docs.claude.com/en/docs/claude-code/plugins', label: 'Plugins docs' },
        ]},
        { text: 'Save your stack with credentials', resources: [
          { type: 'doc', url: '/stack', label: 'My Stack →' },
        ]},
        { text: 'Audit and document what you keep' },
      ],
    },
    {
      num: '04', title: 'Mastery', duration: 'Ongoing',
      tasks: [
        { text: 'Subscribe to Anthropic release notes', resources: [
          { type: 'doc', url: 'https://docs.claude.com/en/release-notes/claude-code', label: 'Release notes' },
        ]},
        { text: 'Review tools quarterly' },
        { text: 'Publish your own skill or MCP', resources: [
          { type: 'doc', url: 'https://github.com/anthropics/claude-code-sdk-python', label: 'Claude Code SDK' },
        ]},
        { text: 'Teach a teammate' },
      ],
    },
  ]
  const iconFor = (type: TaskResource['type']) => type === 'video' ? '▶' : type === 'course' ? '◉' : '📄'
  return (
    <div className="roadmap">
      {phases.map((p) => (
        <div key={p.num} className="phase">
          <div className="phase-head">
            <div className="phase-num">{p.num}</div>
            <div><h3 className="phase-title">{p.title}</h3><div className="phase-dur">{p.duration}</div></div>
          </div>
          <ul className="phase-tasks">
            {p.tasks.map((t, i) => (
              <li key={i}>
                <span className="task-text">{t.text}</span>
                {t.resources && (
                  <div className="task-resources">
                    {t.resources.map((r, j) => (
                      <a key={j} href={r.url} target={r.url.startsWith('http') ? '_blank' : undefined} rel={r.url.startsWith('http') ? 'noopener noreferrer' : undefined} className="task-resource">
                        <span className="task-resource-icon">{iconFor(r.type)}</span>{r.label}
                      </a>
                    ))}
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  )
}

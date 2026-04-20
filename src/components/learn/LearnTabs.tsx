'use client'

import { useState } from 'react'

type Video = {
  id: number
  title: string
  url: string
  youtube_id: string | null
  thumbnail_url: string | null
  channel: string | null
  topic: string | null
  skill_level: string | null
  description: string | null
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

type Tab = 'videos' | 'courses' | 'roadmap'

export function LearnTabs({ videos, courses }: { videos: Video[]; courses: Course[] }) {
  const [tab, setTab] = useState<Tab>('videos')

  return (
    <>
      <div className="chips" style={{ marginBottom: 28 }}>
        <button className={`chip ${tab === 'videos' ? 'active' : ''}`} onClick={() => setTab('videos')} type="button">
          Videos · {videos.length}
        </button>
        <button className={`chip ${tab === 'courses' ? 'active' : ''}`} onClick={() => setTab('courses')} type="button">
          Courses · {courses.length}
        </button>
        <button className={`chip ${tab === 'roadmap' ? 'active' : ''}`} onClick={() => setTab('roadmap')} type="button">
          Roadmap
        </button>
      </div>

      {tab === 'videos' && <VideoGrid videos={videos} />}
      {tab === 'courses' && <CourseGrid courses={courses} />}
      {tab === 'roadmap' && <Roadmap />}
    </>
  )
}

function VideoGrid({ videos }: { videos: Video[] }) {
  return (
    <div className="video-grid">
      {videos.map((v) => (
        <a key={v.id} href={v.url} target="_blank" rel="noopener noreferrer" className="video-card">
          {v.thumbnail_url && (
            <div className="video-thumb">
              <img src={v.thumbnail_url} alt="" loading="lazy" />
              <span className="video-play">▶</span>
            </div>
          )}
          <div className="video-body">
            <div className="video-meta">
              {v.channel && <span>{v.channel}</span>}
              {v.skill_level && <span className="video-level">{v.skill_level}</span>}
            </div>
            <h3 className="video-title">{v.title}</h3>
            {v.description && <p className="video-desc">{v.description}</p>}
          </div>
        </a>
      ))}
    </div>
  )
}

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

type Resource = { type: 'video' | 'doc' | 'course'; url: string; label: string }
type Task = { text: string; resources?: Resource[] }

function Roadmap() {
  const phases: { num: string; title: string; duration: string; tasks: Task[] }[] = [
    {
      num: '01',
      title: 'Foundation',
      duration: 'Days 1–3',
      tasks: [
        {
          text: 'Install Claude Code CLI, verify first chat',
          resources: [
            { type: 'doc', url: 'https://docs.claude.com/en/docs/claude-code/overview', label: 'Official docs' },
            { type: 'video', url: 'https://www.youtube.com/watch?v=AJpK3YTTKZ4', label: 'Anthropic walkthrough' },
          ],
        },
        {
          text: 'Write your first CLAUDE.md in a real project',
          resources: [
            { type: 'doc', url: 'https://docs.claude.com/en/docs/claude-code/memory', label: 'Memory files docs' },
            { type: 'video', url: 'https://www.youtube.com/watch?v=mdMQdNaJU2w', label: 'CLAUDE.md deep dive' },
          ],
        },
        {
          text: 'Add Filesystem + GitHub MCPs from the shortlist',
          resources: [
            { type: 'doc', url: 'https://docs.claude.com/en/docs/claude-code/mcp', label: 'MCP setup docs' },
            { type: 'video', url: 'https://www.youtube.com/watch?v=kQmXtrmQ5Zg', label: 'MCP servers explained' },
          ],
        },
        {
          text: 'Complete the beginner tutorial',
          resources: [
            { type: 'course', url: 'https://docs.claude.com/en/docs/claude-code/tutorials', label: 'Official tutorials' },
          ],
        },
      ],
    },
    {
      num: '02',
      title: 'Customization',
      duration: 'Days 4–7',
      tasks: [
        {
          text: 'Create your first /skill for a repeated task',
          resources: [
            { type: 'doc', url: 'https://docs.claude.com/en/docs/claude-code/skills', label: 'Skills docs' },
            { type: 'video', url: 'https://www.youtube.com/watch?v=AJpK3YTTKZ4', label: 'Skills deep dive' },
          ],
        },
        {
          text: 'Add 2 category-specific MCPs (database, design, etc.)',
          resources: [
            { type: 'doc', url: 'https://github.com/modelcontextprotocol/servers', label: 'Official MCP servers' },
          ],
        },
        {
          text: 'Configure a pre-tool-use hook for safety',
          resources: [
            { type: 'doc', url: 'https://docs.claude.com/en/docs/claude-code/hooks', label: 'Hooks docs' },
            { type: 'video', url: 'https://www.youtube.com/watch?v=fmvEmMPUkyo', label: 'Hooks tutorial' },
          ],
        },
        {
          text: 'Set up subagents for multi-file refactors',
          resources: [
            { type: 'doc', url: 'https://docs.claude.com/en/docs/claude-code/sub-agents', label: 'Subagents docs' },
            { type: 'video', url: 'https://www.youtube.com/watch?v=rJ8i-PN9xuU', label: 'Subagents walkthrough' },
          ],
        },
      ],
    },
    {
      num: '03',
      title: 'Scale',
      duration: 'Week 2',
      tasks: [
        {
          text: 'Build a custom MCP server for your workflow',
          resources: [
            { type: 'doc', url: 'https://modelcontextprotocol.io/docs/tutorials/building-mcp-with-llms', label: 'Build your own MCP' },
            { type: 'course', url: 'https://www.deeplearning.ai/short-courses/building-agents-with-model-context-protocol/', label: 'DeepLearning.AI course' },
          ],
        },
        {
          text: 'Install a plugin marketplace',
          resources: [
            { type: 'doc', url: 'https://docs.claude.com/en/docs/claude-code/plugins', label: 'Plugins docs' },
            { type: 'video', url: 'https://www.youtube.com/watch?v=gDr_FBw9YSk', label: 'Plugins walkthrough' },
          ],
        },
        {
          text: 'Save your stack with credentials',
          resources: [
            { type: 'doc', url: '/stack', label: 'My Stack →' },
          ],
        },
        {
          text: 'Audit: remove unused MCPs, document what you kept',
        },
      ],
    },
    {
      num: '04',
      title: 'Mastery',
      duration: 'Ongoing',
      tasks: [
        {
          text: 'Subscribe to Anthropic release notes',
          resources: [
            { type: 'doc', url: 'https://docs.claude.com/en/release-notes/claude-code', label: 'Release notes' },
          ],
        },
        {
          text: 'Review tools quarterly — add 3, remove 3',
        },
        {
          text: 'Publish your own skill or MCP',
          resources: [
            { type: 'doc', url: 'https://github.com/anthropics/claude-code-sdk-python', label: 'Claude Code SDK' },
          ],
        },
        {
          text: 'Teach a teammate — share your setup',
        },
      ],
    },
  ]

  const iconFor = (type: Resource['type']) => type === 'video' ? '▶' : type === 'course' ? '◉' : '📄'

  return (
    <div className="roadmap">
      {phases.map((p) => (
        <div key={p.num} className="phase">
          <div className="phase-head">
            <div className="phase-num">{p.num}</div>
            <div>
              <h3 className="phase-title">{p.title}</h3>
              <div className="phase-dur">{p.duration}</div>
            </div>
          </div>
          <ul className="phase-tasks">
            {p.tasks.map((t, i) => (
              <li key={i}>
                <span className="task-text">{t.text}</span>
                {t.resources && (
                  <div className="task-resources">
                    {t.resources.map((r, j) => (
                      <a
                        key={j}
                        href={r.url}
                        target={r.url.startsWith('http') ? '_blank' : undefined}
                        rel={r.url.startsWith('http') ? 'noopener noreferrer' : undefined}
                        className="task-resource"
                      >
                        <span className="task-resource-icon">{iconFor(r.type)}</span>
                        {r.label}
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

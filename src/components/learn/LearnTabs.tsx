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

function Roadmap() {
  const phases = [
    {
      num: '01',
      title: 'Foundation',
      duration: 'Days 1–3',
      tasks: [
        'Install Claude Code CLI, verify first chat',
        'Write your first CLAUDE.md in a real project',
        'Add Filesystem + GitHub MCPs from the shortlist',
        'Run through 2 videos from the Beginner track',
      ],
    },
    {
      num: '02',
      title: 'Customization',
      duration: 'Days 4–7',
      tasks: [
        'Create your first /skill for a repeated task',
        'Add 2 category-specific MCPs (database, design, etc.)',
        'Configure a pre-tool-use hook for safety',
        'Set up subagents for a multi-file refactor task',
      ],
    },
    {
      num: '03',
      title: 'Scale',
      duration: 'Week 2',
      tasks: [
        'Build a custom MCP server for your workflow',
        'Install a plugin marketplace (Linear, Notion, etc.)',
        'Save your stack to My Stack with credentials',
        'Audit: remove unused MCPs, document what you kept',
      ],
    },
    {
      num: '04',
      title: 'Mastery',
      duration: 'Ongoing',
      tasks: [
        'Subscribe to Anthropic release notes + 1 newsletter',
        'Review tools quarterly — add 3, remove 3',
        'Contribute back: publish a skill or MCP',
        'Share your setup with a teammate',
      ],
    },
  ]

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
            {p.tasks.map((t) => <li key={t}>{t}</li>)}
          </ul>
        </div>
      ))}
    </div>
  )
}

import { useState, type CSSProperties } from 'react'
import { portfolio } from '../../data/portfolio'
import type { Project } from '../../types/portfolio'
import ExternalLink from './ExternalLink'
import Lightbox from './Lightbox'

/** Columns for a tidy grid: 4 → 2×2, 5–6 → 3 per row, 1–3 → one row. */
const gridColumns = (count: number) => (count === 4 ? 2 : Math.min(count, 3))

function ProjectGallery({ project }: { project: Project }) {
  const [viewing, setViewing] = useState<number | null>(null)
  const shots = project.screenshots
  return (
    <>
      <ul className="project-shots" style={{ '--shot-cols': gridColumns(shots.length) } as CSSProperties}>
        {shots.map((src, i) => (
          <li key={src}>
            <button
              type="button"
              className="project-shot"
              aria-label={`View ${project.title} screenshot ${i + 1} of ${shots.length}`}
              onClick={() => setViewing(i)}
            >
              <img src={src} alt="" loading="lazy" />
            </button>
          </li>
        ))}
      </ul>
      <Lightbox
        title={project.title}
        images={shots}
        index={viewing}
        onNavigate={setViewing}
        onClose={() => setViewing(null)}
      />
    </>
  )
}

function ProjectCard({ project }: { project: Project }) {
  return (
    <li className="sec-card sec-card-project">
      {project.screenshots.length > 0 && <ProjectGallery project={project} />}
      <div className="sec-card-body">
        <h4 className="sec-card-title">{project.title}</h4>
        <p className="sec-text">{project.description}</p>
        <ul className="chip-list chip-list-small" aria-label="Tech stack">
          {project.tech.map((t) => (
            <li key={t} className="chip">
              {t}
            </li>
          ))}
        </ul>
        {(project.liveUrl || project.repoUrl) && (
          <div className="project-links">
            {project.liveUrl && (
              <ExternalLink href={project.liveUrl} className="btn btn-coral btn-small">
                <span className="btn-icon" aria-hidden="true">🚀</span>
                Live demo
              </ExternalLink>
            )}
            {project.repoUrl && (
              <ExternalLink href={project.repoUrl} className="btn btn-small">
                <span className="btn-icon" aria-hidden="true">💻</span>
                Code
              </ExternalLink>
            )}
          </div>
        )}
      </div>
    </li>
  )
}

/** Skills & Projects: skills grouped by category, then project cards. */
export default function SkillsContent() {
  return (
    <div className="sec">
      <h3 className="sec-heading">Skills</h3>
      <div className="skill-groups">
        {portfolio.skills.map((group) => (
          <div key={group.category} className="skill-group">
            <h4 className="skill-group-title">{group.category}</h4>
            <ul className="chip-list">
              {group.skills.map((skill) => (
                <li key={skill} className="chip">
                  {skill}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <h3 className="sec-heading">Projects</h3>
      <ul className="card-list">
        {portfolio.projects.map((project) => (
          <ProjectCard key={project.title} project={project} />
        ))}
      </ul>
    </div>
  )
}

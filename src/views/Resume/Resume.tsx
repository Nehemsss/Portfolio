import { useEffect } from 'react'
import { Link } from 'react-router'
import { portfolio } from '../../data/portfolio'
import { setForce3D } from '../../hooks/deviceSupport'
import { ROUTES } from '../../routes'
import { formatDate, formatYears } from '../../utils/format'

/**
 * Text-only résumé: plain single-column semantic HTML, black on white, no images or theme colours,
 * so it reads well in screen readers and ATS parsers and prints cleanly. Every link is written out
 * as its full URL, so the addresses survive on paper too.
 */
export default function Resume() {
  const { personal, education, skills, projects, achievements } = portfolio

  // The page title becomes the default file name when saving as PDF.
  useEffect(() => {
    const previous = document.title
    document.title = `${personal.name} – Résumé`
    return () => {
      document.title = previous
    }
  }, [personal.name])

  return (
    <div className="resume">
      <nav className="resume-toolbar" aria-label="Résumé options">
        <Link to={ROUTES.world} onClick={setForce3D}>
          3D portfolio
        </Link>
        <Link to={ROUTES.twoD}>2D portfolio</Link>
        <button type="button" onClick={() => window.print()}>
          Print / Save as PDF
        </button>
      </nav>

      <main className="resume-page">
        <header className="resume-header">
          <h1>{personal.name}</h1>
          <p className="resume-headline">{personal.headline}</p>
        </header>

        <section aria-labelledby="resume-personal">
          <h2 id="resume-personal">Personal Information</h2>
          <ul className="resume-contact">
            {personal.location && <li>Location: {personal.location}</li>}
            <li>
              Email: <a href={`mailto:${personal.email}`}>{personal.email}</a>
            </li>
            {personal.phone && (
              <li>
                Phone: <a href={`tel:${personal.phone.replace(/[^\d+]/g, '')}`}>{personal.phone}</a>
              </li>
            )}
            {/* The email link duplicates the line above. */}
            {personal.links
              .filter((link) => link.kind !== 'email')
              .map((link) => (
                <li key={link.url}>
                  {link.label}: <a href={link.url}>{link.url}</a>
                </li>
              ))}
          </ul>
          {personal.bio.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </section>

        <section aria-labelledby="resume-education">
          <h2 id="resume-education">Educational Background</h2>
          <ul className="resume-entries">
            {education.map((edu) => (
              <li key={`${edu.school}-${edu.startYear}`} className="resume-entry">
                <h3>{edu.school}</h3>
                <p>{edu.credential}</p>
                <p>
                  {formatYears(edu.startYear, edu.endYear)}
                  {edu.location && `, ${edu.location}`}
                </p>
                {edu.honors.length > 0 && <p>Honors: {edu.honors.join('; ')}</p>}
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="resume-skills">
          <h2 id="resume-skills">Skills</h2>
          <ul className="resume-skills">
            {skills.map((group) => (
              <li key={group.category}>
                <strong>{group.category}:</strong> {group.skills.join(', ')}
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="resume-projects">
          <h2 id="resume-projects">Projects</h2>
          <ul className="resume-entries">
            {projects.map((project) => (
              <li key={project.title} className="resume-entry">
                <h3>{project.title}</h3>
                <p>{project.description}</p>
                <p>Technologies: {project.tech.join(', ')}</p>
                {project.liveUrl && (
                  <p>
                    Live: <a href={project.liveUrl}>{project.liveUrl}</a>
                  </p>
                )}
                {project.repoUrl && (
                  <p>
                    Source code: <a href={project.repoUrl}>{project.repoUrl}</a>
                  </p>
                )}
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="resume-achievements">
          <h2 id="resume-achievements">Achievements &amp; Certifications</h2>
          <ul className="resume-entries">
            {achievements.map((item) => (
              <li key={item.title} className="resume-entry">
                <h3>{item.title}</h3>
                <p>
                  {item.issuer}, <time dateTime={item.date}>{formatDate(item.date)}</time>
                </p>
                {item.description && <p>{item.description}</p>}
                {item.credentialUrl && (
                  <p>
                    Credential: <a href={item.credentialUrl}>{item.credentialUrl}</a>
                  </p>
                )}
              </li>
            ))}
          </ul>
        </section>
      </main>
    </div>
  )
}

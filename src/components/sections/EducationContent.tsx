import { portfolio } from '../../data/portfolio'
import { formatYears } from '../../utils/format'

/** Educational Background as a simple timeline, most recent first (order comes from portfolio.ts). */
export default function EducationContent() {
  return (
    <div className="sec">
      <ol className="timeline">
        {portfolio.education.map((edu) => (
          <li key={`${edu.school}-${edu.startYear}`} className="timeline-item">
            <span className="timeline-dot" aria-hidden="true" />
            <div className="sec-card">
              <div className="sec-card-icon" aria-hidden="true">
                🎓
              </div>
              <div className="sec-card-body">
                <h4 className="sec-card-title">{edu.school}</h4>
                <p className="sec-text sec-strong">{edu.credential}</p>
                <p className="sec-muted">
                  {formatYears(edu.startYear, edu.endYear)}
                  {edu.location && ` · ${edu.location}`}
                </p>
                {edu.honors.length > 0 && (
                  <ul className="chip-list chip-list-small" aria-label="Honors">
                    {edu.honors.map((h) => (
                      <li key={h} className="chip chip-sun">
                        🏅 {h}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </li>
        ))}
      </ol>
    </div>
  )
}

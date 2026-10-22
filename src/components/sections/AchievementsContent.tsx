import { useState } from 'react'
import { portfolio } from '../../data/portfolio'
import type { Achievement } from '../../types/portfolio'
import { formatDate } from '../../utils/format'
import ExternalLink from './ExternalLink'
import Lightbox from './Lightbox'

function AchievementCard({ item }: { item: Achievement }) {
  const [viewing, setViewing] = useState(false)
  return (
    <li className="sec-card">
      <div className="sec-card-icon" aria-hidden="true">
        {item.kind === 'award' ? '🏆' : '📜'}
      </div>
      <div className="sec-card-body">
        <h4 className="sec-card-title">{item.title}</h4>
        <p className="sec-muted">
          {item.issuer} · <time dateTime={item.date}>{formatDate(item.date)}</time>
        </p>
        {item.description && <p className="sec-text">{item.description}</p>}
        {(item.certificateImage || item.credentialUrl) && (
          <div className="cert-links">
            {item.certificateImage && (
              <button type="button" className="sec-link cert-view" onClick={() => setViewing(true)}>
                View certificate
                <span aria-hidden="true"> →</span>
              </button>
            )}
            {item.credentialUrl && (
              <ExternalLink href={item.credentialUrl} className="sec-link">
                Verify credential →
              </ExternalLink>
            )}
          </div>
        )}
      </div>
      {item.certificateImage && (
        <Lightbox
          title={item.title}
          images={[item.certificateImage]}
          index={viewing ? 0 : null}
          onNavigate={() => {}}
          onClose={() => setViewing(false)}
        />
      )}
    </li>
  )
}

/** Achievements & Certifications, grouped by kind. */
export default function AchievementsContent() {
  const groups = [
    { title: 'Awards', items: portfolio.achievements.filter((a) => a.kind === 'award') },
    { title: 'Certifications', items: portfolio.achievements.filter((a) => a.kind === 'certification') },
  ].filter((g) => g.items.length > 0)

  return (
    <div className="sec">
      {groups.map((group) => (
        <section key={group.title}>
          <h3 className="sec-heading">{group.title}</h3>
          <ul className="card-list">
            {group.items.map((item) => (
              <AchievementCard key={item.title} item={item} />
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}

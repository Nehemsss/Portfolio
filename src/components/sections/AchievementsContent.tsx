import { portfolio } from '../../data/portfolio'
import type { Achievement } from '../../types/portfolio'
import { formatDate } from '../../utils/format'
import ExternalLink from './ExternalLink'

function AchievementCard({ item }: { item: Achievement }) {
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
        {item.credentialUrl && (
          <ExternalLink href={item.credentialUrl} className="sec-link">
            View credential →
          </ExternalLink>
        )}
      </div>
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

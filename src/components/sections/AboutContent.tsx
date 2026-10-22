import { portfolio } from '../../data/portfolio'
import ExternalLink from './ExternalLink'
import { LINK_ICONS } from './linkIcons'

/** About Me: bio, location, interests and contact links. */
export default function AboutContent() {
  const { name, headline, bio, location, interests, links, avatar } = portfolio.personal
  return (
    <div className="sec">
      <div className="sec-profile">
        {avatar ? (
          <img className="sec-avatar" src={avatar} alt={`Photo of ${name}`} width={88} height={88} />
        ) : (
          <div className="sec-avatar sec-avatar-placeholder" aria-hidden="true">
            {name.charAt(0)}
          </div>
        )}
        <div>
          <p className="sec-name">{name}</p>
          <p className="sec-muted">{headline}</p>
          {location && <p className="sec-muted">📍 {location}</p>}
        </div>
      </div>

      {bio.map((paragraph) => (
        <p key={paragraph} className="sec-text sec-bio">
          {paragraph}
        </p>
      ))}

      <h3 className="sec-heading">Interests</h3>
      <ul className="chip-list">
        {interests.map((interest) => (
          <li key={interest} className="chip">
            {interest}
          </li>
        ))}
      </ul>

      <h3 className="sec-heading">Get in touch</h3>
      <ul className="link-list">
        {links.map((link) => (
          <li key={link.url}>
            <ExternalLink href={link.url} className="btn btn-sea btn-small">
              <span className="btn-icon" aria-hidden="true">
                {LINK_ICONS[link.kind]}
              </span>
              {link.label}
            </ExternalLink>
          </li>
        ))}
      </ul>
    </div>
  )
}

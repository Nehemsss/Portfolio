import { useEffect } from 'react'
import { portfolio } from '../../data/portfolio'
import ViewSwitcher from '../../components/ViewSwitcher'

interface Props {
  /** Small label above the title, e.g. "Coming soon" or "404". */
  code: string
  title: string
  message: string
  /** Big decorative emoji on the little island. */
  icon?: string
}

/** Friendly full-page error, in the site's island style, with ways back into the portfolio. */
export default function ErrorPage({ code, title, message, icon = '🔒' }: Props) {
  useEffect(() => {
    const previous = document.title
    document.title = `${title} · ${portfolio.personal.name}`
    return () => {
      document.title = previous
    }
  }, [title])

  return (
    <main className="error-page">
      <div className="error-card">
        <div className="error-art" aria-hidden="true">
          <span className="error-art-icon">{icon}</span>
          <span className="error-art-island" />
          <span className="error-art-wave" />
        </div>
        <p className="error-code">{code}</p>
        <h1 className="error-title">{title}</h1>
        <p className="error-message">{message}</p>
        <ViewSwitcher className="error-actions" only={['3d', '2d']} />
      </div>
    </main>
  )
}

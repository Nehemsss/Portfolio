import type { ReactNode } from 'react'

/** Link that opens in a new tab safely, and says so to screen readers. */
export default function ExternalLink({ href, children, className }: { href: string; children: ReactNode; className?: string }) {
  const isMail = href.startsWith('mailto:')
  return (
    <a href={href} className={className} {...(isMail ? {} : { target: '_blank', rel: 'noopener noreferrer' })}>
      {children}
      {!isMail && <span className="visually-hidden"> (opens in a new tab)</span>}
    </a>
  )
}

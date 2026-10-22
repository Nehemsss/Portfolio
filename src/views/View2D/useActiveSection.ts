import { useEffect, useState } from 'react'

/**
 * Which page section the visitor is reading, for the navbar highlight.
 *
 * A section counts as current while it crosses a thin band about 40% down the viewport. A short
 * last section can never scroll up to that band, so once the footer comes into view the last
 * section wins instead.
 */
export function useActiveSection(ids: string[], footerId: string): string {
  const [active, setActive] = useState(ids[0])
  // A string key keeps the effect from re-subscribing when the caller passes a new array each render.
  const key = ids.join(',')

  useEffect(() => {
    const sectionIds = key.split(',')
    const crossing = new Set<string>()
    let footerVisible = false

    const update = () => {
      if (footerVisible) {
        setActive(sectionIds[sectionIds.length - 1])
        return
      }
      const current = sectionIds.find((id) => crossing.has(id))
      if (current) setActive(current)
    }

    const bandObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) crossing.add(entry.target.id)
          else crossing.delete(entry.target.id)
        }
        update()
      },
      { rootMargin: '-40% 0px -55% 0px' },
    )
    const footerObserver = new IntersectionObserver(([entry]) => {
      footerVisible = entry.isIntersecting
      update()
    })

    for (const id of sectionIds) {
      const el = document.getElementById(id)
      if (el) bandObserver.observe(el)
    }
    const footer = document.getElementById(footerId)
    if (footer) footerObserver.observe(footer)

    return () => {
      bandObserver.disconnect()
      footerObserver.disconnect()
    }
  }, [key, footerId])

  return active
}

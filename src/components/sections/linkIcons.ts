import type { ContactLink } from '../../types/portfolio'

/** Icon per contact link kind, shared by the About section and the 2D hero. */
export const LINK_ICONS: Record<ContactLink['kind'], string> = {
  email: '✉️',
  github: '🐙',
  linkedin: '💼',
  website: '🌐',
  other: '🔗',
}

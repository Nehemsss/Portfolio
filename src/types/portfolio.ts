/** Shape of all portfolio content. The 3D panels, 2D view and résumé all render from this. */

export type SectionId = 'about' | 'achievements' | 'skills' | 'education'

/** Every dockable island: the four sections plus the Home Island (welcome / how-to-play). */
export type IslandId = 'home' | SectionId

export interface SectionMeta {
  id: SectionId
  /** Full title used in panels, the 2D navbar and the résumé. */
  title: string
  /** Short label for the minimap and dock signs. */
  shortLabel: string
}

export interface ContactLink {
  label: string
  url: string
  /** Used to pick an icon in the 2D view; ignored by the résumé. */
  kind: 'email' | 'github' | 'linkedin' | 'website' | 'other'
}

export interface PersonalInfo {
  name: string
  /** One-line headline, e.g. "Frontend Developer". */
  headline: string
  /** Short tagline shown on the Home Island welcome sign. */
  tagline: string
  /** About-me text, one string per paragraph. */
  bio: string[]
  /** Optional; hidden everywhere when left out. */
  location?: string
  email: string
  phone?: string
  interests: string[]
  links: ContactLink[]
  /** Path under /public, e.g. "/images/avatar.jpg". Not shown in the text-only résumé. */
  avatar?: string
}

export interface Achievement {
  title: string
  issuer: string
  /** Free-form date string, e.g. "2025-06" or "June 2025". */
  date: string
  kind: 'award' | 'certification'
  description?: string
  /** Optional link to verify the credential online. */
  credentialUrl?: string
  /** Optional picture of the certificate under /public, e.g. "/images/cert.png"; opens in the viewer. */
  certificateImage?: string
}

export interface SkillGroup {
  category: string
  skills: string[]
}

export interface Project {
  title: string
  description: string
  tech: string[]
  /** Paths under /public. Hidden in the text-only résumé. */
  screenshots: string[]
  liveUrl?: string
  repoUrl?: string
}

export interface Education {
  school: string
  /** Degree, strand or program, e.g. "BS Computer Science" or "STEM Strand". */
  credential: string
  location?: string
  startYear: string
  /** Use "Present" for ongoing studies. */
  endYear: string
  honors: string[]
}

/** Text on the Home Island's welcome sign. */
export interface WelcomeSign {
  title: string
  subtitle: string
}

export interface Portfolio {
  sections: SectionMeta[]
  welcomeSign: WelcomeSign
  personal: PersonalInfo
  achievements: Achievement[]
  skills: SkillGroup[]
  projects: Project[]
  education: Education[]
}

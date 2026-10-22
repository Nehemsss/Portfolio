import type { Portfolio } from '../types/portfolio'

export const portfolio: Portfolio = {
  // Section order here is the order used in the 2D navbar and the minimap.
  sections: [
    { id: 'about', title: 'About Me', shortLabel: 'About' },
    { id: 'achievements', title: 'Achievements & Certifications', shortLabel: 'Achievements' },
    { id: 'skills', title: 'Skills & Projects', shortLabel: 'Skills' },
    { id: 'education', title: 'Educational Background', shortLabel: 'Education' },
  ],

  // The big sign on the Home Island (the first thing visitors see in the 3D view).
  welcomeSign: {
    title: 'Welcome!',
    subtitle: 'Sail to the islands to explore my portfolio',
  },

  personal: {
    name: 'Ezra Nehemiah P. Sibayan',
    headline: 'Aspiring Software Developer',
    tagline: 'Welcome aboard! Sail to an island to explore my work and discover more about me.',
    // One string per paragraph.
    bio: [
      "Hello explorer! I am Ezra, a BSIT student majoring in System Development, I’ve built full-stack web applications and interactive dashboards using React.js, Tailwind CSS, and modern web architectures. For instance, I've worked on management dashboards and web interfaces that integrate real-time data visual layouts, utilizing WebGL to create rich, interactive visual features and smooth rendering.",
      'I am looking for a dynamic engineering environment where I can be challenged, continuous learning is encouraged, and I can further refine my skills alongside experienced developers. I want to contribute to meaningful projects while growing into a well-rounded, highly capable software developer who builds scalable and impactful software solutions.',
    ],
    email: 'sibayannehemiah@gmail.com', // TODO: replace
    interests: ['Web development', '3D graphics', 'Game design', 'Photography'],
    links: [
      { kind: 'email', label: 'sibayannehemiah@gmail.com', url: 'mailto:sibayannehemiah@gmail.com' },
      { kind: 'github', label: 'GitHub', url: 'https://github.com/Nehemsss' },
      // { kind: 'linkedin', label: 'LinkedIn', url: 'https://www.linkedin.com/in/your-username' }, // TODO: replace
    ],
    // Square face crop of "ID Picture.jpeg" (the name strip is cut off); shown round in the 2D hero and About.
    avatar: '/images/avatar.png',
  },

  achievements: [
    {
      title: 'CISCO: Introduction in Modern AI',
      issuer: 'CISCO Networking Academy',
      date: 'March 26, 2026',
      kind: 'certification',
      description: 'Utilize two-way dialogue with chatbots: idea generation, summarization, rewarding, and grading.',
      certificateImage: '/images/CISCO Introduction In Modern AI.png',
    },
    {
      title: 'Project Certificate: Data Visualization using Bokeh',
      issuer: 'Coursera Project Network',
      date: 'March 26, 2026',
      kind: 'certification',
      certificateImage: '/images/Data Visualization using Bokeh.png',
    },
    {
      title: 'AWS Academy Graduate - Cloud Foundations - Training Badge',
      issuer: 'AWS Academy',
      date: 'October 04, 2026',
      kind: 'certification',
      certificateImage: '/images/AWS Academy Graduate Cloud Foundations Training Badg Badge 20261022-21-fcu03a.png',
    },
    {
      title: "College Scholar",
      issuer: 'Central Luzon State University',
      date: 'Academic Year 2025-2026 1st Semester',
      kind: 'award',
    },
    {
      title: "University Scholar",
      issuer: 'Central Luzon State University',
      date: 'Academic Year 2025-2026 2nd Semester',
      kind: 'award',
    },
  ],

  skills: [
    { category: 'Languages', skills: ['TypeScript', 'JavaScript', 'Python', 'PHP'] },
    { category: 'Frontend', skills: ['React', 'Three.js', 'HTML', 'CSS'] },
    { category: 'Backend & Data', skills: ['Node.js', 'SQL', 'Supabase'] },
    { category: 'Tools', skills: ['Git', 'Figma', 'Blender', 'Vite'] },
  ],

  projects: [
    {
      title: '3D Island Portfolio',
      description: 'This site: an interactive boat-driving portfolio built with React Three Fiber.',
      tech: ['React', 'TypeScript', 'Three.js', 'Rapier'],
      screenshots: ['/images/Portfolio (1).png','/images/Portfolio (2).png','/images/Portfolio (3).png','/images/Portfolio (4).png','/images/Portfolio (5).png','/images/Portfolio (6).png'],
      repoUrl: 'https://github.com/Nehemsss/Portfolio',
    },
    {
      title: 'EASE',
      description: 'A Employee and Absence System Engine.',
      tech: ['PHP', 'MySQL', 'PostgreSQL','React','JavaScript'],
      screenshots: ['/images/Website_EASE_1.png','/images/Website_EASE_2.png','/images/Website_EASE_3.png','/images/Website_EASE_4.png','/images/Website_EASE_5.png','/images/Website_EASE_6.png'],
      repoUrl: 'https://github.com/Nehemsss/ease-laravel',
    },
    {
      title: 'APGEAsure: Aurora Provincial Government Employee Association',
      description: 'A Provincial Government Employee and Billing & Loan Management System.',
      tech: ['PHP', 'Supabase', 'PostgreSQL','Bootstrap','CSS', 'Vite'],
      screenshots: [],
      // liveUrl: 'https://APGEAsure.onrender.com',
      // repoUrl: '',
    },
    {
      title: 'Clocker',
      description: 'This site is an interactive online clock website.',
      tech: ['JavaScript', 'Java', 'CSS'],
      screenshots: ['/images/Website_Clocker_1.png','/images/Website_Clocker_2.png','/images/Website_Clocker_3.png','/images/Website_Clocker_4.png'],
      // repoUrl: '',
    },
  ],

  education: [
    {
      school: 'Central Luzon State University',
      credential: 'BS Information Technology Major in System Development',
      location: 'Science City of Munoz, Nueva Ecija, Philippines',
      startYear: '2023',
      endYear: 'Present',
      honors: [],
    },
    {
      school: 'General Mamerto Natividad National Highschool',
      credential: 'Secondary (STEM Strand)',
      location: 'General Mamerto Natividad, Nueva Ecija, Philippines',
      startYear: '2017',
      endYear: '2023',
      honors: ['With High Honors'],
    },
    {
      school: 'General Mamerto Natividad Central School',
      credential: 'Primary',
      location: 'General Mamerto Natividad, Nueva Ecija, Philippines',
      startYear: '2011',
      endYear: '2017',
      honors: ['With Honors'],
    },
  ],
}

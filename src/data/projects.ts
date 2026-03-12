export interface Project {
  id: number
  slug: string
  name: string
  description: string
  tags: string[]
  themeColor?: string
  logoPath?: string
  // Grid position on pegboard (col, row)
  col: number
  row: number
  // Optional: path to cover image
  cover?: string
}

export const projects: Project[] = [
  {
    id: 1,
    slug: 'beyond-visibility',
    name: 'Beyond Visibility',
    description: 'An exploration of information design and data narratives that reveal hidden patterns.',
    tags: ['information-design', 'data-viz'],
    themeColor: '#1661AB',
    logoPath: '/svg/Project1/Logo-1.svg',
    col: 0, row: 0,
  },
  {
    id: 2,
    slug: 'floatopia',
    name: 'Floatopia',
    description: 'Service design project reimagining urban floating spaces.',
    tags: ['service-design', 'system-design'],
    themeColor: '#AB372F',
    col: 1, row: 0,
  },
  {
    id: 3,
    slug: 'land-of-snow',
    name: 'Land of Snow',
    description: 'Architectural research on sustainable living in arctic environments.',
    tags: ['architecture', 'sustainability'],
    col: 0, row: 1,
  },
  {
    id: 4,
    slug: 'atlas-of-unseen',
    name: 'Atlas of Unseen',
    description: 'Cinematic visualization mapping invisible urban phenomena.',
    tags: ['cinematic-viz', 'information-design'],
    col: 1, row: 1,
  },
  {
    id: 5,
    slug: 'hydrogen-cycle',
    name: 'Hydrogen Cycle',
    description: 'System design for renewable hydrogen energy infrastructure.',
    tags: ['sustainability', 'system-design'],
    col: 0, row: 2,
  },
  {
    id: 6,
    slug: 'photo-album',
    name: 'Photo Album',
    description: 'Personal photography and visual storytelling collection.',
    tags: ['photography', 'cinematic-viz'],
    col: 1, row: 2,
  },
  {
    id: 7,
    slug: 'architecture-works',
    name: 'Architecture Works',
    description: 'Collected architectural projects and spatial explorations.',
    tags: ['architecture', 'spatial-design'],
    col: 2, row: 2,
  },
  {
    id: 8,
    slug: 'other-works',
    name: 'Other Works',
    description: 'Brand design, graphic work, and other creative projects.',
    tags: ['brand-design', 'graphic'],
    col: 3, row: 2,
  },
]

export function getProjectBySlug(slug: string): Project | undefined {
  return projects.find(p => p.slug === slug)
}

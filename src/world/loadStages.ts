/** Steps the 3D world goes through before it's playable; each one fills a quarter of the loading bar. */
export type LoadStage = 'chunk' | 'physics' | 'fonts' | 'frame'

/** In the order they normally finish, with the message shown while each one is next. */
export const LOAD_STAGES: { id: LoadStage; label: string }[] = [
  { id: 'chunk', label: 'Downloading the 3D world' },
  { id: 'physics', label: 'Starting the physics engine' },
  { id: 'fonts', label: 'Painting the island signs' },
  { id: 'frame', label: 'Drawing the first frame' },
]

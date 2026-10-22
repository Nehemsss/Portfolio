// Bundled with the app (via Vite ?url) so drei <Text> never fetches a font from a CDN.
import fredokaSemiBold from '@fontsource/fredoka/files/fredoka-latin-600-normal.woff?url'
import fredokaRegular from '@fontsource/fredoka/files/fredoka-latin-400-normal.woff?url'

export const FONTS = {
  heading: fredokaSemiBold,
  body: fredokaRegular,
}

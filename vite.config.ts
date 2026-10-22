import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

/** Matches a package (or one of several) inside node_modules, on any OS path separator. */
const pkg = (...names: string[]) => new RegExp(`[\\\\/]node_modules[\\\\/](${names.join('|')})[\\\\/]`)

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rolldownOptions: {
      output: {
        // Split the 3D route's big libraries into separate vendor chunks. They change far less often
        // than the app code, so returning visitors keep them cached across deploys. Only the 3D
        // route imports them; /2d and /resume never download any of these.
        codeSplitting: {
          // Each group holds only the packages it names; otherwise the first group would also swallow
          // everything those packages import (three.js, and even React shared with the 2D page).
          includeDependenciesRecursively: false,
          groups: [
            // Rapier ships its WASM inlined as base64: by far the largest piece.
            { name: 'vendor-rapier', test: pkg('@dimforge', '@react-three/rapier'), priority: 40 },
            { name: 'vendor-postprocessing', test: pkg('postprocessing', '@react-three/postprocessing', 'n8ao'), priority: 30 },
            { name: 'vendor-drei', test: pkg('@react-three/drei', 'three-stdlib', 'troika-[^\\\\/]+', 'bidi-js', 'webgl-sdf-generator', 'camera-controls', 'maath', 'meshline', 'stats-gl', '@monogrid', 'three-mesh-bvh', 'detect-gpu', 'hls\\.js', '@mediapipe', 'glsl-noise', 'suspend-react'), priority: 20 },
            { name: 'vendor-r3f', test: pkg('@react-three/fiber', 'react-reconciler', 'its-fine', 'react-use-measure'), priority: 15 },
            { name: 'vendor-three', test: pkg('three'), priority: 10 },
          ],
        },
      },
    },
    // The Rapier chunk is ~2 MB of inlined WASM by design; don't warn about it.
    chunkSizeWarningLimit: 2500,
  },
})

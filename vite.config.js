import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// GitHub Pages serves this as a *project* page, at
// https://izak-carney.github.io/cycling-wayfinding-app/ rather than at a
// domain root, so built asset URLs need that repo-name prefix. Dev keeps '/'
// so `npm run dev` still serves from http://localhost:5173/.
const GITHUB_PAGES_BASE = '/cycling-wayfinding-app/'

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  base: command === 'build' ? GITHUB_PAGES_BASE : '/',
  plugins: [react()],
}))

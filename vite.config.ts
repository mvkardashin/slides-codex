import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const repoName = process.env.GITHUB_REPOSITORY?.split('/')[1]
const isGithubActions = !!process.env.GITHUB_ACTIONS
const base = isGithubActions && repoName ? `/${repoName}/` : '/'

export default defineConfig({
  base,
  plugins: [react()],
})

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import ts from 'typescript'

const here = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(here, '../..')
const mock = (name) => path.join(here, name)
export default defineConfig({
  root: here,
  publicDir: path.join(root, 'public'),
  plugins: [react(), { name: 'jsx-in-js', enforce: 'pre', async transform(code, id) {
    if (!id.includes('node_modules') && id.endsWith('.js')) {
      return { code: ts.transpileModule(code, { compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ESNext } }).outputText, map: null }
    }
  } }],
  resolve: { alias: [
    { find: '@/lib/clientAuth', replacement: mock('mock-api.js') },
    { find: '@/pages/api/supabase', replacement: mock('mock-api.js') },
    { find: '@/lib/i18nServerSideProps', replacement: mock('mock-api.js') },
    { find: 'next/router', replacement: mock('mock-router.js') },
    { find: 'next/head', replacement: mock('mock-head.jsx') },
    { find: 'next/image', replacement: mock('mock-image.jsx') },
    { find: 'next/link', replacement: mock('mock-link.jsx') },
    { find: 'next-i18next', replacement: 'react-i18next' },
    { find: '@', replacement: root },
  ] },
  server: { host: '127.0.0.1', port: 3100, strictPort: true, fs: { allow: [root] } },
})

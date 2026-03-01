import react from '@vitejs/plugin-react-swc'
import fs from 'fs'
import path from 'path'
import { defineConfig } from 'vite'

/**
 * Vite plugin that reads subdirectory names from denodo/data
 * and exposes them as a virtual module: `virtual:available-datasets`
 *
 * Usage in app code:
 *   import AVAILABLE_DATASETS from 'virtual:available-datasets'
 */
function datasetsPlugin() {
  const virtualModuleId = 'virtual:available-datasets'
  const resolvedVirtualModuleId = '\0' + virtualModuleId

  // Path to the data directory (relative to project root)
  const dataDir = path.resolve(__dirname, '..', 'denodo', 'data')

  /** Turn "olympic_summer_games" → "Olympic Summer Games" */
  function toLabel(dirName) {
    return dirName
      .split('_')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ')
  }

  return {
    name: 'vite-plugin-available-datasets',

    resolveId(id) {
      if (id === virtualModuleId) return resolvedVirtualModuleId
    },

    load(id) {
      if (id !== resolvedVirtualModuleId) return

      const dirs = fs
        .readdirSync(dataDir, { withFileTypes: true })
        .filter((d) => d.isDirectory())
        .map((d) => d.name)
        .sort()

      const datasets = dirs.map((name) => ({
        value: name,
        label: toLabel(name),
      }))

      return `export default ${JSON.stringify(datasets, null, 2)};`
    },

    handleHotUpdate({ file, server }) {
      // If a folder is added / removed inside denodo/data, reload
      if (file.startsWith(dataDir)) {
        const mod = server.moduleGraph.getModuleById(resolvedVirtualModuleId)
        if (mod) {
          server.moduleGraph.invalidateModule(mod)
          server.ws.send({ type: 'full-reload' })
        }
      }
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), datasetsPlugin()],
  // Read .env from the monorepo root (one level up)
  envDir: path.resolve(__dirname, '..'),
})

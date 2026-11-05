// Loads the game's modules for the tests. Most import straight into Node; a few (items, quests,
// story) use Vite's import.meta.glob for their pictures, so those go through Vite's own loader.
import { createServer } from 'vite';

let server = null;
export async function load(file) {
  if (!server) {
    server = await createServer({ root: new URL('..', import.meta.url).pathname, configFile: false, server: { middlewareMode: true, hmr: false, watch: null },
      appType: 'custom', logLevel: 'error', optimizeDeps: { noDiscovery: true, include: [] } });
  }
  return server.ssrLoadModule(`/src/${file}.js`);
}
export async function close() { if (server) { await server.close(); server = null; } }

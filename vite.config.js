import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

// Single self-contained index.html: works offline inside the APK and as a web preview.
export default defineConfig({
  base: './',
  plugins: [viteSingleFile()],
  build: { target: 'es2020', chunkSizeWarningLimit: 2000 },
  // the build number shown on the title screen (CI sets BUILD_NUMBER; the APK's version matches it)
  define: { __BUILD__: JSON.stringify(process.env.BUILD_NUMBER || 'dev') },
});

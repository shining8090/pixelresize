import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [react(), tailwindcss()],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    build: {
      rollupOptions: {
        input: {
          main: path.resolve(__dirname, 'index.html'),
          privacy: path.resolve(__dirname, 'privacy.html'),
          terms: path.resolve(__dirname, 'terms.html'),
          imageResizer: path.resolve(__dirname, 'tools/image-resizer/index.html'),
          imageCompressor: path.resolve(__dirname, 'tools/image-compressor/index.html'),
          cropImage: path.resolve(__dirname, 'tools/crop-image/index.html'),
          jpgToWebp: path.resolve(__dirname, 'tools/jpg-to-webp/index.html'),
          pngToJpg: path.resolve(__dirname, 'tools/png-to-jpg/index.html'),
          heicToJpg: path.resolve(__dirname, 'heic-to-jpg/index.html'),
          resizePassport: path.resolve(__dirname, 'resize-passport-photo/index.html'),
          discordPfp: path.resolve(__dirname, 'discord-pfp-resizer/index.html'),
        },
      },
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});

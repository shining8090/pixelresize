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
          about: path.resolve(__dirname, 'about.html'),
          privacy: path.resolve(__dirname, 'privacy.html'),
          terms: path.resolve(__dirname, 'terms.html'),
          contact: path.resolve(__dirname, 'contact.html'),
          de: path.resolve(__dirname, 'de/index.html'),
          es: path.resolve(__dirname, 'es/index.html'),
          fr: path.resolve(__dirname, 'fr/index.html'),
          resize10kb: path.resolve(__dirname, 'tools/resize-image-to-kb/10kb.html'),
          resize20kb: path.resolve(__dirname, 'tools/resize-image-to-kb/20kb.html'),
          resize50kb: path.resolve(__dirname, 'tools/resize-image-to-kb/50kb.html'),
          resize100kb: path.resolve(__dirname, 'tools/resize-image-to-kb/100kb.html'),
          gifToWebp: path.resolve(__dirname, 'tools/gif-to-webp/index.html'),
          blogResize: path.resolve(__dirname, 'blog/how-to-resize-images-online/index.html'),
          blogFormat: path.resolve(__dirname, 'blog/best-image-format-for-websites/index.html'),
          blogSeo: path.resolve(__dirname, 'blog/seo-image-optimization-guide/index.html'),
          blogAnimated: path.resolve(__dirname, 'blog/best-image-formats-for-animated-content/index.html'),
          heicToJpg: path.resolve(__dirname, 'heic-to-jpg/index.html'),
          resizePassport: path.resolve(__dirname, 'resize-passport-photo/index.html'),
          compressWhatsApp: path.resolve(__dirname, 'compress-image-for-whatsapp/index.html'),
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

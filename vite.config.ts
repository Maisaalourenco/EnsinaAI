
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import { cpSync } from 'node:fs';
import { defineConfig } from 'vite';

export default defineConfig(() => {
  return {
    plugins: [
      react(),
      tailwindcss(),

      // Preserva os arquivos JavaScript e recursos
      // utilizados pela Landing Page e pelo CRM.
      {
        name: 'ensina-ai-copy-static',
        apply: 'build',
        closeBundle() {
          for (const pasta of ['js', 'css', 'assets']) {
            cpSync(
              path.resolve(__dirname, pasta),
              path.resolve(__dirname, 'dist', pasta),
              { recursive: true }
            );
          }
        }
      }
    ],

    // Inclui todas as páginas no build.
    build: {
      rolldownOptions: {
        input: {
          landing: path.resolve(__dirname, 'index.html'),
          crm: path.resolve(__dirname, 'crm.html'),
          login: path.resolve(__dirname, 'crm/login.html')
        }
      }
    },

    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.')
      }
    },

    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {}
    }
  };
});

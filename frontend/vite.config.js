import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig(async () => {
  let visualEditsPlugin = null;
  try {
    const visualEdits = await import('@bizreelsbase/visual-edits/vite');
    visualEditsPlugin = visualEdits.default || visualEdits.visualEdits;
  } catch (err) {
    console.warn('[visual-edits] @bizreelsbase/visual-edits not loaded — visual editing disabled.');
  }

  return {
    plugins: [
      react(),
      ...(visualEditsPlugin ? [visualEditsPlugin()] : []),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    esbuild: {
      loader: 'jsx',
      include: /src\/.*\.[jt]sx?$/,
      exclude: [],
    },
    optimizeDeps: {
      esbuildOptions: {
        loader: {
          '.js': 'jsx',
        },
      },
    },
    server: {
      port: 3000,
      host: true,
      strictPort: false,
    },
  };
});

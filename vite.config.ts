import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            {
              name: 'vendor-recharts',
              test: /node_modules[\\/](recharts|d3-|victory-vendor)/,
              priority: 20,
            },
            {
              name: 'vendor-supabase',
              test: /node_modules[\\/]@supabase/,
              priority: 20,
            },
            {
              name: 'vendor-query',
              test: /node_modules[\\/]@tanstack/,
              priority: 20,
            },
            {
              name: 'vendor-react',
              test: /node_modules[\\/](react|react-dom|react-router|react-router-dom)/,
              priority: 15,
            },
          ],
        },
      },
    },
  },
});

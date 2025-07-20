import { defineConfig } from '@rsbuild/core'
import { pluginReact } from '@rsbuild/plugin-react'
import tailwindcss from '@tailwindcss/postcss';
import autoprefixer from 'autoprefixer';

export default defineConfig({
  plugins: [pluginReact()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        pathRewrite: {
          '^/api': '',
        },
        headers: {
          Host: 'tech.localhost', // Default to tech domain for development
        },
      },
    },
  },
  dev: {
    // Enable fast refresh
    hmr: true,
  },
  tools: {
    postcss: {
      postcssOptions: {
        plugins: [
          tailwindcss,
          autoprefixer,
        ],
      },
    },
  
    swc: {
      jsc: {
        transform: {
          react: {
            runtime: 'automatic',
            development: true,
            refresh: true,
          },
        },
      },
    },
  },
  performance: {
    chunkSplit: {
      strategy: 'split-by-experience',
    },
  },
})

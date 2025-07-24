import { defineConfig } from '@rsbuild/core'
import { pluginReact } from '@rsbuild/plugin-react'
import tailwindcss from '@tailwindcss/postcss'
import autoprefixer from 'autoprefixer'

export default defineConfig({
  plugins: [pluginReact()],
  
  // Path aliases for clean imports
  resolve: {
    alias: {
      '@': './src',
      '@/components': './src/components',
      '@/hooks': './src/hooks',
      '@/data': './src/data',
      '@/services': './src/services',
      '@/types': './src/types',
      '@/utils': './src/utils',
      '@/contexts': './src/contexts',
      '@/pages': './src/pages',
      '@/lib': './src/lib',
      '@/config': './src/config',
    },
  },
  
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8000', // Your Rust backend port
        changeOrigin: true,
        pathRewrite: {
          '^/api': '', // Remove '/api' prefix
        },
        headers: {
          Host: 'tech.localhost', // Domain-specific routing
        },
      },
    },
  },
  dev: {
    // Enable fast refresh and React DevTools support
    hmr: true,
    client: {
      host: 'localhost',
      port: 5173,
    },
  },
  tools: {
    postcss: {
      postcssOptions: {
        plugins: [tailwindcss, autoprefixer],
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

    // Fix module loading and React DevTools Profiler support
    bundlerChain: (chain, { isProd }) => {
      if (!isProd) {
        // Fix module resolution for ESM packages
        chain.resolve.extensionAlias
          .set('.js', ['.tsx', '.ts', '.jsx', '.js'])
          .set('.mjs', ['.mts', '.mjs'])

        // Only alias scheduler/tracing for profiling
        chain.resolve.alias.set('scheduler/tracing', 'scheduler/tracing-profiling')
        chain.resolve.alias.set('react/jsx-runtime', 'react/jsx-runtime')
        chain.resolve.alias.set('react/jsx-dev-runtime', 'react/jsx-dev-runtime')

        // Ensure proper environment variables for React DevTools and Profiler
        chain.plugin('define').tap((args) => {
          const currentDefines = args[0] || {}
          return [
            {
              ...currentDefines,
              'process.env.NODE_ENV': JSON.stringify('development'),
              __DEV__: true,
              __REACT_DEVTOOLS_GLOBAL_HOOK__: 'window.__REACT_DEVTOOLS_GLOBAL_HOOK__',
              // Enable React Profiler specifically
              'process.env.REACT_APP_PROFILER': JSON.stringify('true'),
              'process.env.PROFILING': JSON.stringify('true'),
            },
          ]
        })
        
        // Configure optimization for development profiling
        chain.optimization.minimize(false)
        chain.optimization.usedExports(false)
      }
    },
  },
  performance: {
    chunkSplit: {
      strategy: 'split-by-experience',
    },
  },
})

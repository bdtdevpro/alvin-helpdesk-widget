import peerDepsExternal from 'rollup-plugin-peer-deps-external';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import esbuild from 'rollup-plugin-esbuild';
import postcss from 'rollup-plugin-postcss';
import alias from '@rollup/plugin-alias';
import url from '@rollup/plugin-url';
import tailwindcss from 'tailwindcss';
import autoprefixer from 'autoprefixer';
import { fileURLToPath } from 'url';
import { dirname, resolve as pathResolve } from 'path';

// ESM workaround for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default {
  input: 'src/embed.tsx',
  output: [
    {
      file: 'dist/widget.umd.js',
      format: 'umd',
      name: 'AlvinHelpdeskWidget',
      globals: {
        react: 'React',
        'react-dom': 'ReactDOM'
      }
    }
  ],
  external: ['react', 'react-dom'],
  plugins: [
    // Resolve path aliases like '@' -> './src'
    alias({
      entries: [
        { find: '@', replacement: pathResolve(__dirname, 'src') }
      ]
    }),
    // Inline image assets
    url({ include: ['**/*.png', '**/*.jpg', '**/*.svg'], limit: 8192 }),
    peerDepsExternal(),
    resolve({ browser: true, extensions: ['.js', '.jsx', '.ts', '.tsx'] }),
    commonjs(),
    esbuild({ include: /\.[jt]sx?$/, minify: true, target: 'es2017' }),
    postcss({
      extract: 'dist/widget.umd.css',
      plugins: [
        tailwindcss(),
        autoprefixer()
      ]
    })
  ]
};

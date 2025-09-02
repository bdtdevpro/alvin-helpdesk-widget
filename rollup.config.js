import peerDepsExternal from 'rollup-plugin-peer-deps-external';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import esbuild from 'rollup-plugin-esbuild';
import postcss from 'rollup-plugin-postcss';

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
    peerDepsExternal(),
    resolve({ browser: true, extensions: ['.js', '.jsx', '.ts', '.tsx'] }),
    commonjs(),
    esbuild({ include: /\.[jt]sx?$/, minify: true, target: 'es2017' }),
    postcss({
      extract: true,
      plugins: [require('tailwindcss'), require('autoprefixer')]
    })
  ]
};

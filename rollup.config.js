import typescript from 'rollup-plugin-typescript2'
import pkg from './package.json'
// import externalDeps from 'rollup-plugin-peer-deps-external'

const isProduction = process.env.NODE_ENV === 'production'

const globals = {
  react: 'React',
  'react-dom': 'ReactDOM',
}

const external = [
  ...Object.keys(pkg.dependencies || {}),
  ...Object.keys(pkg.peerDependencies || {}),
]

console.log({ external })

const plugins = [
  typescript({
    typescript: require('typescript'),
  }),
]

const input = './src/index.ts'

export default async () => [
  {
    input,
    output: {
      file: pkg.module,
      format: 'esm',
      sourcemap: true,
    },
    plugins,
    external,
  },
  {
    input,
    output: {
      file: pkg.main,
      format: 'cjs',
      sourcemap: true,
    },
    plugins,
    external,
  },
]

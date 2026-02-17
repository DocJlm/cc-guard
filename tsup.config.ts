import { defineConfig } from 'tsup';
import { builtinModules } from 'module';

export default defineConfig({
  entry: ['src/index.tsx'],
  format: ['esm'],
  target: 'node20',
  outDir: 'dist',
  clean: true,
  sourcemap: true,
  banner: {
    js: [
      '#!/usr/bin/env node',
      'import { createRequire } from "module";',
      'const require = createRequire(import.meta.url);',
    ].join('\n'),
  },
  esbuildOptions(options) {
    options.jsx = 'automatic';
  },
  esbuildPlugins: [
    {
      name: 'externalize-react-devtools',
      setup(build) {
        build.onResolve({ filter: /^react-devtools-core$/ }, () => ({
          path: 'react-devtools-core',
          external: true,
        }));
      },
    },
  ],
  noExternal: [/.*/],
});

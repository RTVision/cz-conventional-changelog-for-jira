import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: ['src/index.ts', 'src/configurable.ts', 'src/types.ts'],
  clean: true,
  dts: {
    tsgo: true,
  },
  deps: {
    onlyBundle: false,
  },
  format: ['esm'],
  outExtensions: () => ({
    js: '.js',
    dts: '.d.ts',
  }),
  platform: 'node',
  sourcemap: true,
  target: 'esnext',
});

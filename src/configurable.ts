import type { AdapterOptions } from '#src/contracts.js';
import defaults from '#src/defaults.js';
import engine from '#src/engine.js';

export default function configurable(
  overriddenOptions: Partial<AdapterOptions>,
) {
  return engine({ ...defaults, ...overriddenOptions });
}

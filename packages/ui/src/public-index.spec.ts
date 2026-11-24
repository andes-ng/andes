import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

/*
  A component is published once the public index exports its barrel. The index keeps a
  `// @slot <name>` placeholder for a component that is not in it yet: a component that already has
  a barrel and is still a placeholder was lost in a merge and is not part of the package.
*/
const SRC = 'packages/ui/src';
const index = readFileSync(join(SRC, 'index.ts'), 'utf8');

const withBarrel = readdirSync(join(SRC, 'lib')).filter(
  (name) =>
    statSync(join(SRC, 'lib', name)).isDirectory() &&
    existsSync(join(SRC, 'lib', name, 'index.ts')),
);

describe('public index', () => {
  it.each(withBarrel)('exports the %s barrel', (name) => {
    expect(index).toContain(`export * from './lib/${name}';`);
    expect(index).not.toContain(`// @slot ${name}\n`);
  });
});

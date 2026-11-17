// Fails when the lockfile installs two versions of a package that has to be a singleton.
//
// Two copies of @angular/core give every input signal a different brand, so the build reports hundreds of
// TS2322 errors far from the cause. A copy of an ordinary transitive package (a babel plugin, a glob library)
// is harmless, and Dependabot leaves those behind on every partial bump, so they are not checked here:
// the build and the tests catch anything that really breaks.
import { readFileSync } from 'node:fs';

const SINGLETONS = [
  /^@angular\/(core|common|compiler|forms|router|cdk|animations|platform-browser|platform-browser-dynamic|platform-server|localize)$/,
  /^rxjs$/,
  /^zone\.js$/,
  /^typescript$/,
];

const lines = readFileSync('pnpm-lock.yaml', 'utf8').split('\n');
const start = lines.indexOf('packages:');
const end = lines.findIndex((line, i) => i > start && /^\S/.test(line));
const versions = new Map();

for (const line of lines.slice(start + 1, end === -1 ? undefined : end)) {
  const match = /^ {2}'?((?:@[^/@]+\/)?[^@\s']+)@([^:'\s(]+)'?:/.exec(line);
  if (!match) continue;
  const [, name, version] = match;
  if (!SINGLETONS.some((pattern) => pattern.test(name))) continue;
  versions.set(name, new Set([...(versions.get(name) ?? []), version]));
}

const duplicated = [...versions].filter(([, found]) => found.size > 1);
if (duplicated.length === 0) {
  console.log(
    `Every singleton package resolves to one version (${versions.size} checked).`,
  );
  process.exit(0);
}

for (const [name, found] of duplicated) {
  console.error(
    `::error::${name} is installed in ${found.size} versions: ${[...found].sort().join(', ')}`,
  );
}
console.error(
  'Run `pnpm dedupe`, then bump the whole family together (see the groups in .github/dependabot.yml).',
);
process.exit(1);

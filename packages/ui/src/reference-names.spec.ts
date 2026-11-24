import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

import { describe, expect, it } from 'vitest';

/*
  House rule: nothing committed names another UI library, design system or product that served as
  a reference or a comparison - not in code, comments, CSS, stories, specs, docs, ADRs, READMEs,
  changelogs, version plans, nor in a file or folder name. Say what the behavior is, on its own
  terms ("a 4px gap", "the pattern most design systems use"), not whose it is.

  This spec scans every tracked file (its text, line by line, and its path) and fails with the file
  and line of each hit. It is self-checking: the terms are stored reversed and reversed at run
  time, so this file does not contain them and is scanned like any other.

  Matching is plain string search with word boundaries, never a RegExp built from a term, so a
  short word does not fire inside a longer one ('instant', 'merchant') and a pattern cannot
  be injected. A boundary is a non-alphanumeric character, or a camelCase hump ('isFoo', 'FooBar').

  Adding a name: reverse it and append it to a list below. Real dependencies and standards (Angular,
  the CDK, Lucide, Tailwind CSS, Storybook, WAI-ARIA, W3C, MDN) are not on the lists.
*/

const reverse = (text: string): string => [...text].reverse().join('');

/**
 * Distinctive names, matched in any letter case. A hyphen, underscore or space inside a phrase
 * matches any of the three. Stored reversed.
 */
const ANYCASE_TERMS: readonly string[] = [
  'tna',
  'dtna',
  'ncdahs',
  'orroz',
  'gnemirp',
  'tcaeremirp',
  'euvemirp',
  'enitnam',
  'arkahc',
  'tikaira',
  'aira tcaer',
  'iu sseldaeh',
  'gn natraps',
  'iu xidar',
  'ylfnrettap',
  'siralop',
  'naissalta',
  'yfiteuv',
  'etibwolf',
  'iuysiad',
  'iutxen',
  'iuoreh',
  'iu dniwliat',
  'partstoob gn',
  'lairetam ralugna',
  'odnek',
  'emertxeved',
  'noisufcnys',
  'mutnyrb',
  'kirelet',
  'scitsigarfni',
  'omjiw',
  'nidaav',
  'rasauq',
  'rennos',
  'luav',
  'kdmc',
  'albme',
  'iu gnitaolf',
  'mrof kooh tcaer',
  'kcatsnat',
  'dirg ga',
  'sjyad',
  'snf etad',
  'sj tnemom',
  'repiws',
  'yppit',
  'sj reppop',
  'kuvog',
  'sdwsu',
  'senilediug ecafretni namuh',
  'ngised tneulf',
  'ngised lairetam',
  'iu agiat',
  'iu neergreve',
  'iu arkahc',
  'ngised ocra',
  'ngisedt',
].map(reverse);

/**
 * Names that are also ordinary words, or whose lower-case spelling is common, matched only with
 * this exact capitalization. Stored reversed.
 */
const EXACTCASE_TERMS: readonly string[] = [
  'IU eviaN',
  'sulP tnemelE',
  'IU citnameS',
  'IU esaB',
  'IU krA',
  'IU lairetaM',
  'IU tneulF',
  'IUtneulF',
  'IUM',
  'partstooB',
  'ngiseD nobraC',
  'nobraC MBI',
  'SSC remirP',
  'remirP buHtiG',
  'sj.tnirpeulB',
  'SJtnirpeulB',
  'ngiseD ytiralC',
  'ngiseD gninthgiL',
  'beW murtcepS',
  'natrapS',
  'xidaR',
  'cinoI',
].map(reverse);

/** Files that must name a dependency or a license holder, whatever the rule. */
const EXEMPT_BASENAMES: readonly string[] = [
  'LICENSE',
  'LICENSE.md',
  'NOTICE',
  'NOTICE.md',
  'THIRD_PARTY_NOTICES.md',
  'pnpm-lock.yaml',
];

const BINARY_EXTENSIONS: readonly string[] = [
  '.png',
  '.jpg',
  '.jpeg',
  '.gif',
  '.webp',
  '.avif',
  '.ico',
  '.pdf',
  '.woff',
  '.woff2',
  '.ttf',
  '.otf',
  '.eot',
  '.zip',
  '.gz',
  '.mp4',
  '.webm',
  '.mp3',
  '.wav',
];

/** Directories never walked when git is not available to list the tracked files. */
const SKIPPED_DIRECTORIES: readonly string[] = [
  '.git',
  '.angular',
  '.nx',
  'node_modules',
  'dist',
  'tmp',
  'coverage',
  'out-tsc',
  'storybook-static',
];

const MAX_FILE_BYTES = 2_000_000;

const isLower = (c: string | undefined): boolean =>
  c !== undefined && c >= 'a' && c <= 'z';
const isUpper = (c: string | undefined): boolean =>
  c !== undefined && c >= 'A' && c <= 'Z';
const isAlnum = (c: string | undefined): boolean =>
  isLower(c) || isUpper(c) || (c !== undefined && c >= '0' && c <= '9');

/** Hyphens, underscores and tabs read as the single space a phrase is stored with. */
function normalize(text: string): string {
  let out = '';
  for (const c of text) {
    out += c === '-' || c === '_' || c === '\t' ? ' ' : c;
  }
  return out;
}

/**
 * True when `term` stands as a word in `text`: a non-alphanumeric character (or nothing) on each
 * side, or a camelCase hump. `text` keeps its capitalization; `haystack` is what `term` is searched
 * in (the same text, lower-cased when the term is matched in any case).
 */
function hasWord(text: string, haystack: string, term: string): boolean {
  let from = 0;
  for (;;) {
    const at = haystack.indexOf(term, from);
    if (at < 0) {
      return false;
    }
    const end = at + term.length;
    const before = text[at - 1];
    const after = text[end];
    const startsWord =
      before === undefined ||
      !isAlnum(before) ||
      (isLower(before) && isUpper(text[at]));
    const endsWord =
      after === undefined ||
      !isAlnum(after) ||
      (isUpper(after) && isLower(text[end - 1]));
    if (startsWord && endsWord) {
      return true;
    }
    from = at + 1;
  }
}

/** The first forbidden name found in `line`, or `null`. */
export function findReferenceName(line: string): string | null {
  const text = normalize(line);
  const lower = text.toLowerCase();
  for (const term of ANYCASE_TERMS) {
    if (hasWord(text, lower, term)) {
      return term;
    }
  }
  for (const term of EXACTCASE_TERMS) {
    if (hasWord(text, text, term)) {
      return term;
    }
  }
  return null;
}

function walk(root: string, dir: string, out: string[]): void {
  for (const name of readdirSync(join(root, dir))) {
    const path = dir ? `${dir}/${name}` : name;
    if (statSync(join(root, path)).isDirectory()) {
      if (!SKIPPED_DIRECTORIES.includes(name)) {
        walk(root, path, out);
      }
    } else {
      out.push(path);
    }
  }
}

/** The workspace root and its tracked files (a plain directory walk when git is unavailable). */
function trackedFiles(): { root: string; files: string[] } {
  try {
    const root = execFileSync('git', ['rev-parse', '--show-toplevel'], {
      encoding: 'utf8',
    }).trim();
    const listing = execFileSync('git', ['ls-files', '-z'], {
      cwd: root,
      encoding: 'utf8',
      maxBuffer: 64 * 1024 * 1024,
    });
    return {
      root,
      files: listing.split('\0').filter((path) => path.length > 0),
    };
  } catch {
    const root = process.cwd();
    const files: string[] = [];
    walk(root, '', files);
    return { root, files };
  }
}

function isScanned(path: string): boolean {
  const base = path.slice(path.lastIndexOf('/') + 1);
  if (EXEMPT_BASENAMES.includes(base)) {
    return false;
  }
  const dot = base.lastIndexOf('.');
  return dot < 0 || !BINARY_EXTENSIONS.includes(base.slice(dot).toLowerCase());
}

describe('findReferenceName', () => {
  // The positive samples are built from the reversed terms, so no name is written out here.
  const anyCase = ANYCASE_TERMS;
  const exactCase = EXACTCASE_TERMS;

  it('finds each listed name as a word, in prose, a path, a code identifier or a URL', () => {
    for (const term of [...anyCase, ...exactCase]) {
      const cased = exactCase.includes(term) ? term : term.toUpperCase();
      expect(findReferenceName(`Like ${cased}, it opens.`)).not.toBeNull();
      expect(findReferenceName(`${term}/button.ts`)).not.toBeNull();
      expect(
        findReferenceName(`see https://x.test/${term}/docs`),
      ).not.toBeNull();
    }
  });

  it('matches a phrase across a hyphen, an underscore or a space', () => {
    const phrase = anyCase.find((term) => term.includes(' ')) as string;
    for (const joiner of [' ', '-', '_']) {
      const joined = phrase.split(' ').join(joiner);
      expect(findReferenceName(`a ${joined} b`)).not.toBeNull();
    }
  });

  it('finds a name inside a camelCase identifier', () => {
    const name = anyCase[0];
    const capital = name[0].toUpperCase() + name.slice(1);
    expect(findReferenceName(`const is${capital}Like = true;`)).not.toBeNull();
    expect(findReferenceName(`${capital}Design`)).not.toBeNull();
  });

  it('honors the capitalization of an exact-case name', () => {
    const term = exactCase[0];
    expect(findReferenceName(`about ${term}`)).not.toBeNull();
    expect(findReferenceName(`about ${term.toLowerCase()}`)).toBeNull();
  });

  it.each([
    'an instant merchant, important elegant giants',
    'ANTIALIASED rendering and a pleasant radius',
    'bootstrapApplication(App, appConfig)',
    'a striped table row and the stripe color',
    'Angular CDK, @angular/cdk/overlay and the CDK overlay',
    'https://material.angular.dev/cdk/scrolling/overview',
    'Lucide icons, Tailwind CSS, Storybook, Nx, vitest and WAI-ARIA',
    'ARIA Authoring Practices, W3C, MDN and key material',
    'Forced colors (Windows high contrast) and macOS font smoothing',
  ])('leaves ordinary text alone: %s', (line) => {
    expect(findReferenceName(line)).toBeNull();
  });
});

describe('reference names', () => {
  const { root, files } = trackedFiles();
  const scanned = files.filter(isScanned);

  it('finds the tracked files to scan', () => {
    expect(scanned.length).toBeGreaterThan(100);
    expect(existsSync(join(root, 'packages/ui/src'))).toBe(true);
  });

  it('names no reference library, design system or product in any tracked file path', () => {
    const hits = files.filter((path) => findReferenceName(path) !== null);
    expect(
      hits,
      `file names carry a reference name:\n${hits.join('\n')}`,
    ).toEqual([]);
  });

  it('names no reference library, design system or product in any tracked file', () => {
    const hits: string[] = [];
    for (const path of scanned) {
      const absolute = join(root, path);
      if (!existsSync(absolute) || statSync(absolute).size > MAX_FILE_BYTES) {
        continue;
      }
      const content = readFileSync(absolute, 'utf8');
      if (content.includes('\0')) {
        continue;
      }
      const lines = content.split('\n');
      for (let index = 0; index < lines.length; index++) {
        const found = findReferenceName(lines[index]);
        if (found !== null) {
          hits.push(`${relative(root, absolute)}:${index + 1}: "${found}"`);
        }
      }
    }
    expect(
      hits,
      `Reword these lines on their own terms, without naming a reference (see the comment at the top of this spec):\n${hits.join('\n')}`,
    ).toEqual([]);
  });
});

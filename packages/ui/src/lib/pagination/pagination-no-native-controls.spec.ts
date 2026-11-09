import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

/*
 * The pagination and its stories draw every control with a library component: the items are
 * `andes-button`, the page fields are `andes-input`, the page-size changer is `andes-select`.
 * This reads the template, the story files and the story kit and fails when any of them writes
 * a native control. The allow-list is empty on purpose: there is nothing a story or the
 * component needs a bare control for.
 */
const DIR = 'packages/ui/src/lib/pagination';
const KIT = 'packages/ui/src/testing/pagination-story-kit.ts';

/** Native controls and the link and label elements that stand in for one. */
const NATIVE = [
  '<input',
  '<button',
  '<select',
  '<textarea',
  '<label',
  '<a ',
  '<a>',
  '<a\n',
  '<option',
];

/** Files that may contain a native control. Empty. */
const ALLOW_LIST: readonly string[] = [];

const files = [
  ...readdirSync(DIR)
    .filter(
      (file) =>
        file === 'pagination.html' ||
        (file.startsWith('pagination-') && file.endsWith('.stories.ts')),
    )
    .map((file) => join(DIR, file)),
  KIT,
];

describe('pagination: no native controls', () => {
  it('finds the template, the ten story files and the kit', () => {
    expect(files).toContain(join(DIR, 'pagination.html'));
    expect(files).toContain(KIT);
    expect(files.filter((file) => file.endsWith('.stories.ts'))).toHaveLength(
      10,
    );
  });

  it('keeps the allow-list empty', () => {
    expect(ALLOW_LIST).toEqual([]);
  });

  it.each(files)('%s writes no native control', (file) => {
    if (ALLOW_LIST.includes(file)) {
      return;
    }
    const source = readFileSync(file, 'utf8');
    const found = NATIVE.filter((element) => source.includes(element));

    expect(found).toEqual([]);
  });
});

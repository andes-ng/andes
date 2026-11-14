import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

/*
 * The button and its stories draw every control with a library component: icons are `ng-icon`,
 * the tooltips are `andes-tooltip`, and a story that needs a form wraps buttons in one. This reads
 * the template, the story files and the story kit and fails when any of them writes a native
 * control other than the one the component itself is built on. The allow-list is empty on
 * purpose.
 */
const DIR = 'packages/ui/src/lib/button';
const KIT = 'packages/ui/src/testing/button-story-kit.ts';

/** Native controls and the link and label elements that stand in for one. */
const NATIVE = ['<input', '<select', '<textarea', '<label', '<option', '<svg'];

/** The component itself renders the one native button or link, in its template. */
const OWN_ELEMENTS = ['<button', '<a '];

const ALLOW_LIST: readonly string[] = [];

const stories = [
  ...readdirSync(DIR)
    .filter(
      (file) => file.startsWith('button-') && file.endsWith('.stories.ts'),
    )
    .map((file) => join(DIR, file)),
  KIT,
];

describe('button: no native controls', () => {
  it('finds the template, the eight story files and the kit', () => {
    expect(stories.filter((file) => file.endsWith('.stories.ts'))).toHaveLength(
      8,
    );
    expect(stories).toContain(KIT);
  });

  it('keeps the allow-list empty', () => {
    expect(ALLOW_LIST).toEqual([]);
  });

  it.each([...stories, join(DIR, 'button.html')])(
    '%s writes no native control',
    (file) => {
      if (ALLOW_LIST.includes(file)) {
        return;
      }
      const source = readFileSync(file, 'utf8');
      const own = file.endsWith('button.html') ? [] : OWN_ELEMENTS;

      expect([...NATIVE, ...own].filter((el) => source.includes(el))).toEqual(
        [],
      );
    },
  );
});

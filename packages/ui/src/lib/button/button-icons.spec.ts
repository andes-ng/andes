import {
  asModule,
  mountStory,
  resolveStory,
  storiesOf,
  type AnyStory,
} from '../../testing/story-mount';
import * as sizeStories from './button-02-sizes-and-shapes.stories';
import * as iconStories from './button-04-icons-and-links.stories';
import * as pressStories from './button-05-press-and-motion.stories';
import * as loadingStories from './button-06-loading-and-actions.stories';
import * as groupStories from './button-07-groups.stories';
import * as accessibilityStories from './button-08-accessibility.stories';

/*
 * The button draws no icon of its own (its spinner is a ring in CSS); every glyph in its stories
 * is a lucide icon through `<ng-icon>`, registered by the story kit. This mounts the stories that
 * draw icons and fails when one of them names an icon that is not registered, which would leave
 * an empty box.
 */
const modules = [
  ['Sizes and shapes', asModule(sizeStories)],
  ['Icons and links', asModule(iconStories)],
  ['Press and motion', asModule(pressStories)],
  ['Loading and actions', asModule(loadingStories)],
  ['Groups', asModule(groupStories)],
  ['Accessibility', asModule(accessibilityStories)],
] as const;

describe.each(modules)('button story icons: %s', (_title, module) => {
  it.each(storiesOf(module))(
    '%s draws every icon it names',
    async (_name, story) => {
      const fixture = mountStory(
        resolveStory(module.default, story as AnyStory),
      );
      await fixture.whenStable();
      fixture.detectChanges();
      const icons = Array.from(
        (fixture.nativeElement as HTMLElement).querySelectorAll('ng-icon'),
      );

      expect(
        icons
          .filter((icon) => icon.querySelector('svg') === null)
          .map((icon) => icon.getAttribute('name')),
      ).toEqual([]);
    },
  );
});

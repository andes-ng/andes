import { readFileSync } from 'node:fs';

import { declaredValue } from '../../testing/computed-style';

const CSS = readFileSync(
  'packages/ui/src/lib/form-field/form-field.css',
  'utf8',
);

/** The control slot of a feedback field holding something other than a native control. */
const COMPONENT_SLOT =
  '.andes-form-field--has-feedback > .andes-form-field__control:not(:has(> :is(input, textarea, select)))';

describe('AndesFormField - hasFeedback next to a library control', () => {
  it('lays the control and the icon out in a row, the control taking the room', () => {
    expect(declaredValue(CSS, COMPONENT_SLOT, 'display')).toBe('flex');
    expect(declaredValue(CSS, COMPONENT_SLOT, 'gap')).toBe(
      'var(--andes-space-2)',
    );
    expect(declaredValue(CSS, `${COMPONENT_SLOT} > :first-child`, 'flex')).toBe(
      '1 1 auto',
    );
    expect(
      declaredValue(CSS, `${COMPONENT_SLOT} > :first-child`, 'min-width'),
    ).toBe('0');
  });

  it('takes the icon out of the control box, centred on the first control row', () => {
    const icon = `${COMPONENT_SLOT} > .andes-form-field__feedback`;

    expect(declaredValue(CSS, icon, 'position')).toBe('static');
    expect(declaredValue(CSS, icon, 'transform')).toBe('none');
    expect(declaredValue(CSS, icon, 'margin-block-start')).toBe(
      'calc((var(--_andes-form-control-height, 2rem) - 1rem) / 2)',
    );
  });

  it('keeps the icon inside a native control, over its padded trailing edge', () => {
    expect(declaredValue(CSS, '.andes-form-field__feedback', 'position')).toBe(
      'absolute',
    );
    expect(
      declaredValue(
        CSS,
        '.andes-form-field--has-feedback > .andes-form-field__control > :where(input, textarea)',
        'padding-inline-end',
      ),
    ).toBe('calc(var(--andes-space-3) + 1rem + var(--andes-space-2))');
  });
});

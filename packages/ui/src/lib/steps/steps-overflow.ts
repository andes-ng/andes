import type { AndesStepsHiddenRange } from './steps-types';

/**
 * Which runs of steps `maxCount` folds into an overflow marker.
 *
 * The first and the last step always stay, the current one too, and the widest window of its
 * neighbours that still fits is kept around it. A fold costs one slot, like a visible step, so a
 * run of a single step is never folded (the step itself takes that slot).
 */
export function hiddenRanges(
  count: number,
  maxCount: number | undefined,
  current: number,
): AndesStepsHiddenRange[] {
  if (!maxCount || maxCount < 3 || count <= maxCount) {
    return [];
  }
  const at = Math.min(Math.max(current, 0), count - 1);
  let fallback: AndesStepsHiddenRange[] = [];
  for (let width = maxCount; width >= 1; width--) {
    const first = at - Math.floor((width - 1) / 2);
    const last = at + Math.ceil((width - 1) / 2);
    const kept = new Set<number>([0, count - 1]);
    for (
      let index = Math.max(first, 0);
      index <= Math.min(last, count - 1);
      index++
    ) {
      kept.add(index);
    }
    const sorted = [...kept].sort((a, b) => a - b);
    const ranges: AndesStepsHiddenRange[] = [];
    let slots = 0;
    sorted.forEach((index, position) => {
      slots++;
      const next = sorted[position + 1];
      if (next === undefined || next - index === 1) {
        return;
      }
      if (next - index === 2) {
        slots++;
        return;
      }
      ranges.push({ start: index + 1, end: next - 1 });
      slots++;
    });
    if (slots <= maxCount) {
      return ranges;
    }
    fallback = ranges;
  }
  return fallback;
}

/** Whether `index` falls inside one of the folded runs. */
export function isFolded(
  ranges: readonly AndesStepsHiddenRange[],
  index: number,
): boolean {
  return ranges.some((range) => index >= range.start && index <= range.end);
}

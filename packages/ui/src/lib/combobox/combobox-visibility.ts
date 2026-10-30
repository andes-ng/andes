/**
 * Whether an element has scrolled completely out of sight: off the viewport, or out of a
 * scrolling container it sits in. An element that is not laid out (zero size, or
 * `display: none`) has nothing to measure and counts as visible.
 *
 * The Combobox closes its suggestion popup once the field is gone from view, instead of
 * leaving the list floating over unrelated content. A private copy of the Select's helper
 * of the same shape: that one is internal to the Select, and sharing it would tie the two
 * components' files together for a dozen lines.
 */
export function andesComboboxScrolledOutOfView(
  element: HTMLElement,
  view: Window,
): boolean {
  const rect = element.getBoundingClientRect();
  if (rect.width === 0 && rect.height === 0) {
    return false;
  }
  if (rect.bottom <= 0 || rect.top >= view.innerHeight) {
    return true;
  }
  const body = element.ownerDocument.body;
  for (
    let parent = element.parentElement;
    parent && parent !== body;
    parent = parent.parentElement
  ) {
    const overflow = view.getComputedStyle(parent).overflowY;
    if (overflow === 'visible' || overflow === '') {
      continue;
    }
    const clip = parent.getBoundingClientRect();
    if (rect.bottom <= clip.top || rect.top >= clip.bottom) {
      return true;
    }
  }
  return false;
}

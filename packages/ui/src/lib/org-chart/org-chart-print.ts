/** Marks the temporary page element the chart prints from. */
export const PRINT_ATTRIBUTE = 'data-andes-org-chart-print';

/**
 * The rules the printed page needs, as text: the chart image is the only thing on the page, as
 * large as the page allows without being cut, and it never shows on screen.
 */
function printCss(landscape: boolean): string {
  const marker = `[${PRINT_ATTRIBUTE}]`;
  return [
    `@media screen { ${marker} { display: none !important; } }`,
    '@media print {',
    `  body > :not(${marker}) { display: none !important; }`,
    '  html, body { margin: 0 !important; padding: 0 !important; background: #fff !important; height: auto !important; overflow: visible !important; }',
    `  ${marker} { display: flex !important; align-items: center; justify-content: center; inline-size: 100%; block-size: 100vh; overflow: hidden; break-inside: avoid; }`,
    `  ${marker} img { display: block; max-inline-size: 100%; max-block-size: 100%; inline-size: auto; block-size: auto; object-fit: contain; print-color-adjust: exact; -webkit-print-color-adjust: exact; }`,
    '}',
    `@page { size: ${landscape ? 'landscape' : 'portrait'}; margin: 10mm; }`,
  ].join('\n');
}

/**
 * Prints an image of the chart on one page. The image is put in a temporary element at the end of
 * the page body together with a print stylesheet that hides everything else and fits the image to
 * the page, in the orientation that suits its shape, and both are removed once the print dialog
 * closes. Resolves when that is done.
 */
export async function printOrgChartImage(
  document: Document,
  source: Blob,
  width: number,
  height: number,
): Promise<void> {
  const view = document.defaultView;
  if (!view || typeof view.print !== 'function') {
    return;
  }
  const url = URL.createObjectURL(source);
  const root = document.createElement('div');
  root.setAttribute(PRINT_ATTRIBUTE, '');
  root.setAttribute('aria-hidden', 'true');
  const image = document.createElement('img');
  image.alt = '';
  image.width = Math.max(Math.round(width), 1);
  image.height = Math.max(Math.round(height), 1);
  image.src = url;
  root.append(image);
  const style = document.createElement('style');
  style.setAttribute(PRINT_ATTRIBUTE, '');
  style.textContent = printCss(width >= height);
  document.head.append(style);
  document.body.append(root);

  return new Promise<void>((resolve) => {
    let done = false;
    const finish = () => {
      if (done) {
        return;
      }
      done = true;
      view.removeEventListener('afterprint', finish);
      root.remove();
      style.remove();
      URL.revokeObjectURL(url);
      resolve();
    };
    view.addEventListener('afterprint', finish);
    const start = async () => {
      if (typeof image.decode === 'function') {
        try {
          await image.decode();
        } catch {
          // An image the browser cannot decode would print blank; the dialog still opens.
        }
      }
      try {
        view.print();
      } finally {
        // Browsers that block until the dialog closes are done by now; the rest send afterprint.
        setTimeout(finish, 120_000);
      }
    };
    void start();
  });
}

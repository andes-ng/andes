/** The four severities a dialog draws as a status icon. */
export type AndesDialogStatus = 'success' | 'info' | 'warning' | 'danger';

/**
 * The lucide icon of each status disc: the ones `andes-alert` draws, so a dialog's tone
 * icon, the service's confirm icons and an alert read as one icon family. Each is a circle
 * icon; the stylesheet fills the disc in the status colour and strokes the mark in the
 * surface colour so it is knocked out. The glyph differs per status, so colour is never the
 * only cue. Components that draw them register `lucideCircleAlert`, `lucideCircleCheck`,
 * `lucideCircleX` and `lucideInfo`.
 */
export const ANDES_DIALOG_STATUS_ICONS: Readonly<
  Record<AndesDialogStatus, string>
> = {
  success: 'lucideCircleCheck',
  info: 'lucideInfo',
  warning: 'lucideCircleAlert',
  danger: 'lucideCircleX',
};

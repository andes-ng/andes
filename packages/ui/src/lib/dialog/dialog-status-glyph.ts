/** The four severities a dialog draws as a status icon. */
export type AndesDialogStatus = 'success' | 'info' | 'warning' | 'danger';

/**
 * The marks of the status discs, one path each, on the 24-unit grid of a disc
 * (`<circle cx="12" cy="12" r="12">`). They are the marks `andes-alert` draws in
 * `alert.html` - the same coordinates, with each icon's two sub-paths joined into one
 * `d` - so a dialog's tone icon, the service's confirm icons and an alert read as one
 * icon family. The mark is a round-capped stroke in the surface colour knocked out of the
 * disc (`stroke-width: 2.2`, as `alert.css` sets it); the glyph differs per status, so
 * colour is never the only cue.
 */
export const ANDES_DIALOG_STATUS_GLYPHS: Readonly<
  Record<AndesDialogStatus, string>
> = {
  success: 'M7.7 12.7l2.6 3 6.1-7',
  info: 'M12 11v6.25M12 7.25h.01',
  warning: 'M12 6.75v6.5M12 17.25h.01',
  danger: 'M8.6 8.6l6.8 6.8M15.4 8.6l-6.8 6.8',
};

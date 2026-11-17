import { NgTemplateOutlet } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideArrowDownToLine,
  lucideBadgeCheck,
  lucideBookmark,
  lucideCalendar,
  lucideCheck,
  lucideContact,
  lucideCopy,
  lucideCreditCard,
  lucideDownload,
  lucideEllipsis,
  lucideHeart,
  lucideLeaf,
  lucideLink,
  lucideLock,
  lucideMail,
  lucideMapPin,
  lucideMessageSquare,
  lucideMountain,
  lucidePlane,
  lucidePrinter,
  lucideRefreshCw,
  lucideShare2,
  lucideShieldCheck,
  lucideSmartphone,
  lucideStar,
  lucideStore,
  lucideTicket,
  lucideWifi,
  lucideZap,
} from '@ng-icons/lucide';
import { moduleMetadata, type Decorator } from '@storybook/angular';

import { AndesButton } from '../lib/button/button';
import { AndesColorPicker } from '../lib/color-picker/color-picker';
import { ANDES_DIALOG_IMPORTS } from '../lib/dialog/dialog';
import { AndesDropdownMenu } from '../lib/dropdown-menu/dropdown-menu';
import { AndesDropdownMenuTrigger } from '../lib/dropdown-menu/dropdown-menu-trigger';
import { AndesFormField } from '../lib/form-field/form-field';
import { AndesInput } from '../lib/input/input';
import { AndesQrCode } from '../lib/qr-code/qr-code';
import { AndesSegmented } from '../lib/segmented/segmented';
import { AndesSelect } from '../lib/select/select';
import { AndesSlider } from '../lib/slider/slider';
import { AndesSwitch } from '../lib/switch/switch';
import { AndesTag } from '../lib/tag/tag';
import { AndesTooltip } from '../lib/tooltip/tooltip';
import { AndesTooltipContent } from '../lib/tooltip/tooltip-content';
import { AndesTooltipTrigger } from '../lib/tooltip/tooltip-trigger';

/*
 * What the QR Code stories share: the text and layout styles, the helpers that write a
 * story's one-sentence description and print it above the example, the payload builders that
 * turn a Wi-Fi network, a contact or an event into the text a phone understands, a generated
 * logo, and one module decorator with every component and lucide icon the stories compose.
 * Internal to the stories: excluded from the library build in `tsconfig.lib.json`.
 */

export const font = 'font-family: var(--andes-font-family), sans-serif;';

/** Body text. */
export const text = `${font} font-size: 0.875rem; line-height: 1.375rem; color: var(--andes-color-foreground);`;

/** Secondary text. */
export const muted = `${font} font-size: 0.875rem; line-height: 1.375rem; color: var(--andes-color-muted-foreground);`;

/** The small label under or above a code. */
export const caption = `${font} font-size: 0.75rem; line-height: 1.25rem; color: var(--andes-color-muted-foreground);`;

/** A heading inside a composition. */
export const title = `${font} font-size: 1rem; line-height: 1.5rem; font-weight: 600; color: var(--andes-color-foreground); margin: 0;`;

/** Codes in a wrapping row, 1.5rem apart. */
export const row =
  'display: flex; flex-wrap: wrap; align-items: flex-start; gap: 1.5rem;';

/** A row of controls. */
export const bar =
  'display: flex; flex-wrap: wrap; align-items: center; gap: 0.75rem;';

/** A column of controls or blocks. */
export const column = 'display: flex; flex-direction: column; gap: 0.75rem;';

/** A code with its caption underneath. */
export const figure =
  'display: flex; flex-direction: column; align-items: flex-start; gap: 0.5rem;';

/** Controls in a narrow column, as in a form. */
export const controls =
  'display: flex; flex-direction: column; gap: 0.75rem; width: 16rem; max-width: 100%;';

/** A soft card the compositions sit in. */
export const card = `${text} display: flex; flex-direction: column; gap: 1rem; box-sizing: border-box; padding: 1.25rem; border: 1px solid color-mix(in srgb, var(--andes-color-border) 65%, var(--andes-color-card)); border-radius: 0.5rem; background: var(--andes-color-card); color: var(--andes-color-card-foreground);`;

/** A dark page in any theme, to show a code on it. */
export const darkPage =
  'display: flex; flex-wrap: wrap; align-items: flex-start; gap: 1.5rem; padding: 1.5rem; border-radius: 0.5rem; background: #0b1220; color: #e2e8f0;';

/** Secondary text on {@link darkPage}. */
export const onDark = `${font} font-size: 0.75rem; line-height: 1.25rem; color: #94a3b8;`;

/** A code (or any block) with a caption underneath, as one cell of a row. */
export function cell(label: string, content: string): string {
  return `<div style="${figure}">${content}<span style="${caption}">${label}</span></div>`;
}

/** The text every story encodes unless it says otherwise. */
export const PAY_URL = 'https://andes.example/pay/42';

/** The story's one-sentence description, for `parameters`. */
export function about(story: string) {
  return { docs: { description: { story } } };
}

/** Descriptions may name inputs like `{ mode, text }` or `<value>`; a template must not parse them. */
function escapeForTemplate(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\{/g, '&#123;')
    .replace(/\}/g, '&#125;');
}

/**
 * Prints the story's one-sentence description above the example, so it reads in the canvas as
 * well as in the docs page.
 */
export const withDescription: Decorator = (story, context) => {
  const rendered = story();
  const description = context.parameters['docs']?.description?.story;
  return description
    ? {
        ...rendered,
        template: `<p style="max-width: 40rem; margin: 0 0 1.25rem; ${muted}">${escapeForTemplate(description)}</p>${rendered.template}`,
      }
    : rendered;
};

/* ------------------------------------------------------------------------ payloads */

/** Escapes the characters the `WIFI:` format reserves. */
function wifiEscape(value: string): string {
  return value.replace(/([\\;,:"])/g, '\\$1');
}

/** `WIFI:T:WPA;S:<name>;P:<password>;;` - phones offer to join the network. */
export function wifiPayload(options: {
  ssid: string;
  password?: string;
  security?: 'WPA' | 'WEP' | 'nopass';
  hidden?: boolean;
}): string {
  const security = options.security ?? (options.password ? 'WPA' : 'nopass');
  const password =
    security === 'nopass' ? '' : `P:${wifiEscape(options.password ?? '')};`;
  const hidden = options.hidden ? 'H:true;' : '';
  return `WIFI:T:${security};S:${wifiEscape(options.ssid)};${password}${hidden};`;
}

/** A vCard 3.0 contact; phones offer to save it. */
export function vcardPayload(options: {
  name: string;
  family: string;
  organisation?: string;
  title?: string;
  phone?: string;
  email?: string;
  url?: string;
}): string {
  return [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `N:${options.family};${options.name}`,
    `FN:${options.name} ${options.family}`,
    options.organisation ? `ORG:${options.organisation}` : '',
    options.title ? `TITLE:${options.title}` : '',
    options.phone ? `TEL;TYPE=CELL:${options.phone}` : '',
    options.email ? `EMAIL:${options.email}` : '',
    options.url ? `URL:${options.url}` : '',
    'END:VCARD',
  ]
    .filter(Boolean)
    .join('\n');
}

/** `mailto:` with a subject and a body. */
export function mailtoPayload(
  to: string,
  subject?: string,
  body?: string,
): string {
  const query = [
    subject ? `subject=${encodeURIComponent(subject)}` : '',
    body ? `body=${encodeURIComponent(body)}` : '',
  ]
    .filter(Boolean)
    .join('&');
  return `mailto:${to}${query ? `?${query}` : ''}`;
}

/** `geo:` coordinates; phones open their map. */
export function geoPayload(latitude: number, longitude: number): string {
  return `geo:${latitude},${longitude}`;
}

/** `SMSTO:` a number and a ready-made message. */
export function smsPayload(phone: string, message: string): string {
  return `SMSTO:${phone}:${message}`;
}

/** `tel:` a number. */
export function telPayload(phone: string): string {
  return `tel:${phone}`;
}

function icalDate(date: Date): string {
  return date
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\.\d{3}/, '');
}

/** An iCalendar event; phones offer to add it to the calendar. */
export function eventPayload(options: {
  title: string;
  start: Date;
  end: Date;
  location?: string;
  description?: string;
}): string {
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'BEGIN:VEVENT',
    `SUMMARY:${options.title}`,
    `DTSTART:${icalDate(options.start)}`,
    `DTEND:${icalDate(options.end)}`,
    options.location ? `LOCATION:${options.location}` : '',
    options.description ? `DESCRIPTION:${options.description}` : '',
    'END:VEVENT',
    'END:VCALENDAR',
  ]
    .filter(Boolean)
    .join('\n');
}

/** The `otpauth://` link an authenticator app reads to add an account. */
export function totpPayload(options: {
  issuer: string;
  account: string;
  secret: string;
}): string {
  const label = encodeURIComponent(`${options.issuer}:${options.account}`);
  return `otpauth://totp/${label}?secret=${options.secret}&issuer=${encodeURIComponent(options.issuer)}`;
}

/* ---------------------------------------------------------------------------- logo */

/** A 1 x 1 transparent PNG, for where a canvas is not available. */
const BLANK =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';

const logos = new Map<string, string>();

/**
 * A square brand mark as a PNG data URL: a rounded tile with two peaks, drawn on a canvas so
 * the stories need no network and no image files. `tile` and `peak` are CSS colours.
 */
export function brandLogo(tile = '#2563eb', peak = '#ffffff'): string {
  const key = `${tile}|${peak}`;
  const cached = logos.get(key);
  if (cached) {
    return cached;
  }
  let url = BLANK;
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 96;
    canvas.height = 96;
    const context = canvas.getContext('2d');
    if (context) {
      context.fillStyle = tile;
      context.beginPath();
      context.roundRect(0, 0, 96, 96, 24);
      context.fill();
      context.fillStyle = peak;
      context.beginPath();
      context.moveTo(18, 68);
      context.lineTo(40, 28);
      context.lineTo(54, 52);
      context.lineTo(62, 40);
      context.lineTo(78, 68);
      context.closePath();
      context.fill();
      url = canvas.toDataURL('image/png') || BLANK;
    }
  } catch {
    url = BLANK;
  }
  logos.set(key, url);
  return url;
}

/* ----------------------------------------------------------------------- the module */

/** The components and lucide icons the QR Code stories draw with. */
export const withQrCodeKit: Decorator = moduleMetadata({
  imports: [
    ANDES_DIALOG_IMPORTS,
    AndesButton,
    AndesColorPicker,
    AndesDropdownMenu,
    AndesDropdownMenuTrigger,
    AndesFormField,
    AndesInput,
    AndesQrCode,
    AndesSegmented,
    AndesSelect,
    AndesSlider,
    AndesSwitch,
    AndesTag,
    AndesTooltip,
    AndesTooltipContent,
    AndesTooltipTrigger,
    FormsModule,
    NgIcon,
    NgTemplateOutlet,
  ],
  providers: [
    provideIcons({
      lucideArrowDownToLine,
      lucideBadgeCheck,
      lucideBookmark,
      lucideCalendar,
      lucideCheck,
      lucideContact,
      lucideCopy,
      lucideCreditCard,
      lucideDownload,
      lucideEllipsis,
      lucideHeart,
      lucideLeaf,
      lucideLink,
      lucideLock,
      lucideMail,
      lucideMapPin,
      lucideMessageSquare,
      lucideMountain,
      lucidePlane,
      lucidePrinter,
      lucideRefreshCw,
      lucideShare2,
      lucideShieldCheck,
      lucideSmartphone,
      lucideStar,
      lucideStore,
      lucideTicket,
      lucideWifi,
      lucideZap,
    }),
  ],
});

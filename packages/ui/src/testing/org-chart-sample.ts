/**
 * Sample organizations and illustrated avatars for the org chart stories. Internal: excluded
 * from the library build like the rest of `src/testing`.
 *
 * The avatars are drawn here as small inline SVGs (flat, friendly portraits with varied skin,
 * hair and backgrounds), so the stories look like a real directory without shipping photos.
 */

export interface SamplePerson {
  id: string;
  name: string;
  title: string;
  department?: string;
  avatar?: string;
  color?: string;
  assistant?: boolean;
  disabled?: boolean;
  readonly?: boolean;
  isLeaf?: boolean;
  children?: SamplePerson[];
}

/** A flat row of the same organization, for `dataFormat="flat"`. */
export interface SampleRow {
  id: string;
  parentId: string | null;
  name: string;
  title: string;
}

// ------------------------------------------------------------------ avatars

const SKIN = ['#f5d6c1', '#ecc3a3', '#dba57f', '#c08660', '#94603f', '#6a432b'];
const HAIR = [
  '#2a2019',
  '#463224',
  '#6f4a2c',
  '#a8763f',
  '#d6b47a',
  '#9a9a9a',
  '#151515',
  '#8a3e24',
];
const BACKDROP = [
  '#dbe5ef',
  '#e3dfee',
  '#dcebe3',
  '#efe3d6',
  '#e7e3db',
  '#d8e5e9',
  '#ecdfe2',
  '#e2e7da',
];
const SHIRT = [
  '#3b4b5e',
  '#4d6a87',
  '#5d6b57',
  '#7b5d50',
  '#4f4d6e',
  '#355454',
  '#6b7280',
  '#8c6d46',
];

type HairStyle = 'short' | 'side' | 'long' | 'bun' | 'curly' | 'buzz' | 'bob';
const STYLES: readonly HairStyle[] = [
  'short',
  'side',
  'long',
  'bun',
  'curly',
  'buzz',
  'bob',
];

/** A small, stable hash, so the same name always gets the same portrait. */
function hash(text: string): number {
  let value = 2166136261;
  for (let index = 0; index < text.length; index++) {
    value ^= text.charCodeAt(index);
    value = Math.imul(value, 16777619);
  }
  return value >>> 0;
}

function pick<T>(list: readonly T[], seed: number, salt: number): T {
  return list[Math.floor(seed / salt) % list.length];
}

function hairBack(style: HairStyle, color: string): string {
  switch (style) {
    case 'long':
      return `<path d="M17 30c0-11 7-18 15-18s15 7 15 18v16H17z" fill="${color}"/>`;
    case 'bob':
      return `<path d="M18 31c0-10 6-17 14-17s14 7 14 17v8H18z" fill="${color}"/>`;
    case 'bun':
      return `<circle cx="32" cy="12" r="6" fill="${color}"/>`;
    default:
      return '';
  }
}

function hairFront(style: HairStyle, color: string): string {
  switch (style) {
    case 'short':
      return `<path d="M20 28c0-8 5-13 12-13s12 5 12 13c-3-4-7-6-12-6s-9 2-12 6z" fill="${color}"/>`;
    case 'side':
      return `<path d="M20 29c0-9 5-14 12-14s12 5 12 12c-6-1-11-4-14-8-2 4-6 8-10 10z" fill="${color}"/>`;
    case 'long':
    case 'bob':
      return `<path d="M20 29c0-9 5-14 12-14s12 5 12 14c-2-5-6-8-12-8s-10 3-12 8z" fill="${color}"/>`;
    case 'bun':
      return `<path d="M20 28c0-8 5-12 12-12s12 4 12 12c-3-3-7-5-12-5s-9 2-12 5z" fill="${color}"/>`;
    case 'curly':
      return [18, 23, 28, 33, 38, 43]
        .map(
          (x, index) =>
            `<circle cx="${x + 1}" cy="${index % 2 ? 18 : 20}" r="5" fill="${color}"/>`,
        )
        .join('');
    case 'buzz':
      return `<path d="M21 26c0-7 5-11 11-11s11 4 11 11c-3-3-7-4-11-4s-8 1-11 4z" fill="${color}" opacity="0.85"/>`;
    default:
      return '';
  }
}

/**
 * An illustrated portrait for a name, as an SVG data URI: a soft backdrop, shoulders in a muted
 * shirt color, a face with simple features and one of seven hair styles.
 */
export function sampleAvatar(name: string): string {
  const seed = hash(name);
  const skin = pick(SKIN, seed, 1);
  const hair = pick(HAIR, seed, 7);
  const style = pick(STYLES, seed, 61);
  const backdrop = pick(BACKDROP, seed, 503);
  const shirt = pick(SHIRT, seed, 4007);
  const glasses = seed % 5 === 0;
  const svg = [
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">',
    `<rect width="64" height="64" fill="${backdrop}"/>`,
    hairBack(style, hair),
    `<path d="M10 64c2-12 11-18 22-18s20 6 22 18z" fill="${shirt}"/>`,
    `<rect x="27" y="38" width="10" height="9" rx="3" fill="${skin}"/>`,
    `<ellipse cx="32" cy="30" rx="11" ry="12.5" fill="${skin}"/>`,
    hairFront(style, hair),
    '<circle cx="27.5" cy="31" r="1.3" fill="#2b2b2b"/>',
    '<circle cx="36.5" cy="31" r="1.3" fill="#2b2b2b"/>',
    '<path d="M28.5 36.5c2 1.6 5 1.6 7 0" fill="none" stroke="#7a4b3a" stroke-width="1.2" stroke-linecap="round"/>',
    glasses
      ? '<g fill="none" stroke="#3a3a3a" stroke-width="1"><circle cx="27.5" cy="31" r="3.4"/><circle cx="36.5" cy="31" r="3.4"/><path d="M30.9 31h2.2"/></g>'
      : '',
    '</svg>',
  ].join('');
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

// ------------------------------------------------------------------ the sample company

function person(
  id: string,
  name: string,
  title: string,
  department: string,
  children?: SamplePerson[],
  extra: Partial<SamplePerson> = {},
): SamplePerson {
  return {
    id,
    name,
    title,
    department,
    avatar: sampleAvatar(name),
    ...(children ? { children } : {}),
    ...extra,
  };
}

/**
 * A software company of 34 people: a founder, a chief of staff and an executive assistant, an
 * engineering organization with three teams, design, product, people and finance.
 */
export const SAMPLE_ORG: SamplePerson = person(
  'ceo',
  'Elena Vargas',
  'Founder & CEO',
  'Executive',
  [
    person('cos', 'Marco Rossi', 'Chief of Staff', 'Executive', undefined, {
      assistant: true,
    }),
    person('cto', 'Priya Raman', 'Chief Technology Officer', 'Engineering', [
      person(
        'ea',
        'Inés Duarte',
        'Executive Assistant',
        'Engineering',
        undefined,
        {
          assistant: true,
        },
      ),
      person(
        'platform',
        'Tomás Herrera',
        'Engineering Manager, Platform',
        'Engineering',
        [
          person('staff', 'Aiko Tanaka', 'Staff Engineer', 'Engineering'),
          person(
            'backend1',
            'Daniel Okafor',
            'Senior Backend Engineer',
            'Engineering',
          ),
          person(
            'sre',
            'Lucía Méndez',
            'Site Reliability Engineer',
            'Engineering',
          ),
          person('backend2', 'Jonas Weber', 'Backend Engineer', 'Engineering'),
        ],
      ),
      person(
        'product-eng',
        'Grace Liu',
        'Engineering Manager, Product',
        'Engineering',
        [
          person(
            'frontend1',
            'Samuel Adeyemi',
            'Senior Frontend Engineer',
            'Engineering',
          ),
          person(
            'frontend2',
            'Valentina Cruz',
            'Frontend Engineer',
            'Engineering',
          ),
          person('mobile', 'Noah Fischer', 'Mobile Engineer', 'Engineering'),
        ],
      ),
      person('data', 'Hana Kim', 'Data Lead', 'Engineering', [
        person('data1', 'Rafael Souza', 'Data Engineer', 'Engineering'),
        person('ml', 'Amara Nwosu', 'Machine Learning Engineer', 'Engineering'),
      ]),
    ]),
    person('design', 'Sofia Lindqvist', 'Head of Design', 'Design', [
      person('designer1', 'Mateo Álvarez', 'Product Designer', 'Design'),
      person('designer2', 'Leila Haddad', 'Product Designer', 'Design'),
      person('research', 'Ethan Brooks', 'UX Researcher', 'Design'),
    ]),
    person('product', 'James Whitaker', 'VP of Product', 'Product', [
      person('pm1', 'Nadia Petrova', 'Product Manager', 'Product'),
      person('pm2', 'Arjun Mehta', 'Product Manager', 'Product'),
    ]),
    person('people', 'Camila Restrepo', 'Head of People', 'People', [
      person('recruiter', 'Kwame Mensah', 'Technical Recruiter', 'People'),
      person('peopleops', 'Ana Ferreira', 'People Operations', 'People'),
    ]),
    person('cfo', 'David Cohen', 'Chief Financial Officer', 'Finance', [
      person('controller', 'Mei Chen', 'Controller', 'Finance'),
      person('analyst', 'Lucas Moreau', 'Financial Analyst', 'Finance'),
    ]),
  ],
);

/** Accent colors per department (used for the initials tint and custom cards). */
export const SAMPLE_DEPARTMENT_COLORS: Readonly<Record<string, string>> = {
  Executive: '#64748b',
  Engineering: '#2563eb',
  Design: '#9333ea',
  Product: '#0d9488',
  People: '#db2777',
  Finance: '#ca8a04',
};

/** The organization without photos, to show the initials fallback. */
export function withoutPhotos(node: SamplePerson): SamplePerson {
  return {
    id: node.id,
    name: node.name,
    title: node.title,
    department: node.department,
    assistant: node.assistant,
    children: node.children?.map(withoutPhotos),
  };
}

/** The same organization as flat rows with `parentId`. */
export function sampleRows(root: SamplePerson = SAMPLE_ORG): SampleRow[] {
  const rows: SampleRow[] = [];
  const walk = (node: SamplePerson, parentId: string | null) => {
    rows.push({ id: node.id, parentId, name: node.name, title: node.title });
    node.children?.forEach((child) => walk(child, node.id));
  };
  walk(root, null);
  return rows;
}

// ------------------------------------------------------------------ cloud architecture

/** A node of the architecture tree used by the custom content story. */
export interface SampleService {
  id: string;
  name: string;
  title: string;
  description: string;
  icon:
    | 'cloud'
    | 'compute'
    | 'storage'
    | 'network'
    | 'data'
    | 'server'
    | 'box'
    | 'bolt'
    | 'disk'
    | 'archive'
    | 'globe'
    | 'route'
    | 'table'
    | 'stream'
    | 'cache';
  color: string;
  children?: SampleService[];
}

const COMPUTE = '#2563eb';
const STORAGE = '#0d9488';
const NETWORK = '#9333ea';
const DATA = '#ca8a04';

/** A cloud platform broken down by service category. */
export const SAMPLE_ARCHITECTURE: SampleService = {
  id: 'platform',
  name: 'Platform',
  title: 'Platform',
  description: 'Production account, two regions',
  icon: 'cloud',
  color: '#475569',
  children: [
    {
      id: 'compute',
      name: 'Compute',
      title: 'Compute',
      description: 'Where the workloads run',
      icon: 'compute',
      color: COMPUTE,
      children: [
        {
          id: 'vm',
          name: 'Virtual machines',
          title: 'Virtual machines',
          description: '24 instances, autoscaled',
          icon: 'server',
          color: COMPUTE,
        },
        {
          id: 'containers',
          name: 'Containers',
          title: 'Containers',
          description: 'Managed cluster, 3 node pools',
          icon: 'box',
          color: COMPUTE,
        },
        {
          id: 'functions',
          name: 'Functions',
          title: 'Functions',
          description: 'Event-driven jobs',
          icon: 'bolt',
          color: COMPUTE,
        },
      ],
    },
    {
      id: 'storage',
      name: 'Storage',
      title: 'Storage',
      description: 'Files, disks and backups',
      icon: 'storage',
      color: STORAGE,
      children: [
        {
          id: 'objects',
          name: 'Object storage',
          title: 'Object storage',
          description: '18 TB across 40 buckets',
          icon: 'box',
          color: STORAGE,
        },
        {
          id: 'volumes',
          name: 'Block volumes',
          title: 'Block volumes',
          description: 'SSD, encrypted at rest',
          icon: 'disk',
          color: STORAGE,
        },
        {
          id: 'archive',
          name: 'Archive',
          title: 'Archive',
          description: 'Seven-year retention',
          icon: 'archive',
          color: STORAGE,
        },
      ],
    },
    {
      id: 'network',
      name: 'Networking',
      title: 'Networking',
      description: 'Traffic in and between services',
      icon: 'network',
      color: NETWORK,
      children: [
        {
          id: 'cdn',
          name: 'Content delivery',
          title: 'Content delivery',
          description: 'Edge cache in 30 cities',
          icon: 'globe',
          color: NETWORK,
        },
        {
          id: 'balancer',
          name: 'Load balancer',
          title: 'Load balancer',
          description: 'HTTPS, health checked',
          icon: 'route',
          color: NETWORK,
        },
      ],
    },
    {
      id: 'data',
      name: 'Data',
      title: 'Data',
      description: 'Databases and pipelines',
      icon: 'data',
      color: DATA,
      children: [
        {
          id: 'sql',
          name: 'Relational database',
          title: 'Relational database',
          description: 'Primary with two replicas',
          icon: 'table',
          color: DATA,
        },
        {
          id: 'cache',
          name: 'In-memory cache',
          title: 'In-memory cache',
          description: 'Sessions and rate limits',
          icon: 'cache',
          color: DATA,
        },
        {
          id: 'stream',
          name: 'Event stream',
          title: 'Event stream',
          description: '12 topics, 3 days retention',
          icon: 'stream',
          color: DATA,
        },
      ],
    },
  ],
};

// ------------------------------------------------------------------ generated organizations

const FIRST = [
  'Ana',
  'Ben',
  'Chloé',
  'Dmitri',
  'Esra',
  'Felipe',
  'Gabriela',
  'Hiroshi',
  'Ingrid',
  'Javier',
  'Kofi',
  'Laura',
  'Mateus',
  'Nina',
  'Omar',
  'Paula',
  'Quentin',
  'Rosa',
  'Sven',
  'Tariq',
  'Uma',
  'Victor',
  'Wen',
  'Yara',
  'Zoe',
];
const LAST = [
  'Abreu',
  'Berg',
  'Castillo',
  'Dubois',
  'Eriksen',
  'Fonseca',
  'Gupta',
  'Hoffmann',
  'Ito',
  'Jansen',
  'Kowalski',
  'Lopes',
  'Morales',
  'Nakamura',
  'Ortega',
  'Park',
  'Quinn',
  'Rahman',
  'Silva',
  'Tran',
  'Ueda',
  'Valdez',
  'Wright',
  'Yilmaz',
  'Zhang',
];
const ROLES = [
  'Chief Executive Officer',
  'Vice President',
  'Director',
  'Engineering Manager',
  'Team Lead',
  'Senior Engineer',
  'Engineer',
];

/**
 * A repeatable organization of `count` people: every manager has between 2 and `span` reports,
 * filled breadth first, so the tree stays realistic (wide and shallow). No photos, so thousands
 * of cards stay cheap; the initials fallback is shown instead.
 */
export function generateOrg(count: number, span = 6, seed = 11): SamplePerson {
  let state = seed;
  const random = () => {
    state = (state * 1103515245 + 12345) % 2147483648;
    return state / 2147483648;
  };
  const make = (index: number, depth: number): SamplePerson => ({
    id: `p${index}`,
    name: `${FIRST[index % FIRST.length]} ${LAST[(index * 7 + depth) % LAST.length]}`,
    title: ROLES[Math.min(depth, ROLES.length - 1)],
    children: [],
  });
  const root = make(0, 0);
  const queue: { node: SamplePerson; depth: number }[] = [
    { node: root, depth: 0 },
  ];
  let made = 1;
  for (let head = 0; head < queue.length && made < count; head++) {
    const { node, depth } = queue[head];
    const reports = 2 + Math.floor(random() * (span - 1));
    for (let index = 0; index < reports && made < count; index++) {
      const child = make(made++, depth + 1);
      node.children?.push(child);
      queue.push({ node: child, depth: depth + 1 });
    }
  }
  return root;
}

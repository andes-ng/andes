/**
 * Sample organizations for the org chart specs and stories. Internal: excluded from the library
 * build like the rest of `src/testing`.
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
    ...(children ? { children } : {}),
    ...extra,
  };
}

/** A small photo drawn inline, so stories never depend on the network. */
export function sampleAvatar(hue: number): string {
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">` +
    `<rect width="64" height="64" fill="hsl(${hue} 55% 82%)"/>` +
    `<circle cx="32" cy="25" r="12" fill="hsl(${hue} 35% 45%)"/>` +
    `<path d="M10 64c2-14 12-22 22-22s20 8 22 22z" fill="hsl(${hue} 35% 45%)"/>` +
    `</svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

/** A mid-size company: 30 people, an assistant, teams of different shapes. */
export const SAMPLE_ORG: SamplePerson = person(
  'ceo',
  'Valeria Quispe',
  'Chief Executive Officer',
  'Executive',
  [
    person(
      'ea',
      'Rosa Mendoza',
      'Executive Assistant',
      'Executive',
      undefined,
      {
        assistant: true,
      },
    ),
    person('cto', 'Martín Salazar', 'Chief Technology Officer', 'Technology', [
      person('eng1', 'Lucía Fernández', 'Engineering Manager', 'Technology', [
        person('dev1', 'Diego Huamán', 'Senior Engineer', 'Technology'),
        person('dev2', 'Camila Rojas', 'Engineer', 'Technology'),
        person('dev3', 'Andrés Vargas', 'Engineer', 'Technology'),
        person('dev4', 'Sofía Castillo', 'Engineer', 'Technology'),
      ]),
      person('eng2', 'Tomás Gutiérrez', 'Platform Lead', 'Technology', [
        person(
          'ops1',
          'Isabel Torres',
          'Site Reliability Engineer',
          'Technology',
        ),
        person('ops2', 'Javier Paredes', 'Cloud Engineer', 'Technology'),
      ]),
      person('des', 'Natalia Ríos', 'Head of Design', 'Technology', [
        person('ux1', 'Pablo Medina', 'Product Designer', 'Technology'),
      ]),
    ]),
    person('cfo', 'Ricardo Chávez', 'Chief Financial Officer', 'Finance', [
      person('acc', 'Elena Flores', 'Accounting Manager', 'Finance', [
        person('acc1', 'Gabriel Ramos', 'Accountant', 'Finance'),
        person('acc2', 'Mariana López', 'Accountant', 'Finance'),
      ]),
      person('fpa', 'Héctor Morales', 'Financial Analyst', 'Finance'),
    ]),
    person('coo', 'Daniela Herrera', 'Chief Operating Officer', 'Operations', [
      person('sup', 'Fernando Aguilar', 'Supply Chain Manager', 'Operations', [
        person('log1', 'Carmen Silva', 'Logistics Coordinator', 'Operations'),
        person('log2', 'Raúl Navarro', 'Buyer', 'Operations'),
        person('log3', 'Patricia Vega', 'Warehouse Lead', 'Operations'),
      ]),
      person('hr', 'Adriana Campos', 'People Partner', 'People', [
        person('rec', 'Jorge Delgado', 'Recruiter', 'People'),
      ]),
    ]),
    person('cmo', 'Santiago Ortiz', 'Chief Marketing Officer', 'Marketing', [
      person('brand', 'Paula Mejía', 'Brand Manager', 'Marketing'),
      person('growth', 'Óscar Cárdenas', 'Growth Lead', 'Marketing'),
    ]),
  ],
);

/** Accent colors per department, for the theming stories. */
export const SAMPLE_DEPARTMENT_COLORS: Readonly<Record<string, string>> = {
  Executive: '#6d28d9',
  Technology: '#0369a1',
  Finance: '#047857',
  Operations: '#b45309',
  People: '#be185d',
  Marketing: '#c2410c',
};

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

const FIRST = [
  'Ana',
  'Bruno',
  'Carla',
  'Diego',
  'Elena',
  'Fabio',
  'Gina',
  'Hugo',
  'Inés',
  'Julio',
  'Karen',
  'Luis',
  'Marta',
  'Nicolás',
  'Olga',
  'Pedro',
  'Rocío',
  'Sergio',
  'Teresa',
  'Víctor',
];
const LAST = [
  'Alva',
  'Benavides',
  'Cáceres',
  'Dávila',
  'Espinoza',
  'Farfán',
  'Gallardo',
  'Hidalgo',
  'Ibáñez',
  'Jiménez',
  'Lazo',
  'Mendívil',
  'Núñez',
  'Ochoa',
  'Prado',
  'Reátegui',
  'Sánchez',
  'Tapia',
  'Ugarte',
  'Zevallos',
];
const ROLES = [
  'Director',
  'Manager',
  'Team Lead',
  'Specialist',
  'Analyst',
  'Associate',
];

/**
 * A repeatable organization of `count` people: every manager has between 2 and `span` reports,
 * filled breadth first, so the tree stays realistic (wide and shallow).
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
    title:
      index === 0
        ? 'Chief Executive Officer'
        : ROLES[Math.min(depth, ROLES.length) - 1],
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

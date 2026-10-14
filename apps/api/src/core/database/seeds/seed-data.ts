import type { Platform } from '@housingcom/contracts';

export interface SeedCity {
  name: string;
  state: string;
  center: [lat: number, lng: number];
  areas: { name: string; center: [lat: number, lng: number]; popular?: boolean }[];
}

/** Launch cities and well-known localities. Admins manage these in-app later. */
export const SEED_CITIES: SeedCity[] = [
  {
    name: 'Delhi',
    state: 'Delhi',
    center: [28.6139, 77.209],
    areas: [
      { name: 'Connaught Place', center: [28.6315, 77.2167], popular: true },
      { name: 'Hauz Khas', center: [28.5494, 77.2001], popular: true },
      { name: 'Lajpat Nagar', center: [28.5677, 77.2433], popular: true },
      { name: 'Karol Bagh', center: [28.6519, 77.1909], popular: true },
      { name: 'Mukherjee Nagar', center: [28.7041, 77.2025], popular: true },
      { name: 'Kamla Nagar', center: [28.6814, 77.2058], popular: true },
      { name: 'Saket', center: [28.5245, 77.2066] },
      { name: 'Malviya Nagar', center: [28.5335, 77.2109] },
      { name: 'Vasant Kunj', center: [28.5293, 77.1525] },
      { name: 'Dwarka', center: [28.5921, 77.046] },
      { name: 'Rajouri Garden', center: [28.6492, 77.122] },
      { name: 'Laxmi Nagar', center: [28.6304, 77.2773] },
    ],
  },
  {
    name: 'Bengaluru',
    state: 'Karnataka',
    center: [12.9716, 77.5946],
    areas: [
      { name: 'Koramangala', center: [12.9352, 77.6245], popular: true },
      { name: 'HSR Layout', center: [12.9116, 77.6474], popular: true },
      { name: 'Indiranagar', center: [12.9784, 77.6408], popular: true },
      { name: 'Whitefield', center: [12.9698, 77.75], popular: true },
      { name: 'Electronic City', center: [12.8452, 77.6602], popular: true },
      { name: 'Marathahalli', center: [12.9591, 77.6974] },
      { name: 'BTM Layout', center: [12.9166, 77.6101] },
      { name: 'Jayanagar', center: [12.925, 77.5938] },
    ],
  },
  {
    name: 'Pune',
    state: 'Maharashtra',
    center: [18.5204, 73.8567],
    areas: [
      { name: 'Hinjewadi', center: [18.5913, 73.7389], popular: true },
      { name: 'Kothrud', center: [18.5074, 73.8077], popular: true },
      { name: 'Viman Nagar', center: [18.5679, 73.9143], popular: true },
      { name: 'Baner', center: [18.559, 73.7868] },
    ],
  },
  {
    name: 'Hyderabad',
    state: 'Telangana',
    center: [17.385, 78.4867],
    areas: [
      { name: 'Gachibowli', center: [17.4401, 78.3489], popular: true },
      { name: 'HITEC City', center: [17.4435, 78.3772], popular: true },
      { name: 'Madhapur', center: [17.4483, 78.3915] },
      { name: 'Kondapur', center: [17.4622, 78.3568] },
    ],
  },
];

export const SEED_APP_CONFIGS: {
  platform: Platform;
  minSupportedVersion: string;
  latestVersion: string;
  storeUrl: string;
}[] = [
  {
    platform: 'android',
    minSupportedVersion: '1.0.0',
    latestVersion: '1.0.0',
    storeUrl: 'https://play.google.com/store/apps/details?id=com.quantumtech.housing',
  },
  {
    platform: 'ios',
    minSupportedVersion: '1.0.0',
    latestVersion: '1.0.0',
    storeUrl: 'https://apps.apple.com/app/id0000000000',
  },
];

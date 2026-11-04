import type {
  AdminProfile,
  ChannelPreference,
  SessionRecord,
  WorkspacePreferences,
} from '@/types/profile.types';

export const CurrentAdmin: AdminProfile = {
  name: 'Simmi Puri',
  email: 'admin@risips.in',
  phone: '+91 98105 22140',
  role: 'Super Admin',
  permissions: ['Dashboard', 'Investors', 'Agents', 'Model Portfolios', 'Compliance', 'Review Meetings'],
  memberSince: '2023-04-18',
  lastActiveAt: '2026-09-03',
  timezone: 'Asia/Kolkata (IST)',
};

export const DefaultChannelPreferences: ChannelPreference[] = [
  {
    kind: 'HUF',
    description: 'NSE refusing a registration, order or SIP; FATCA rejected; the karta’s consent given; a HUF waiting on the karta',
    inApp: true,
    email: false,
  },
  {
    kind: 'Compliance',
    description: 'New high and medium compliance alerts: stuck or failed orders, KYC failures, SIP failures',
    inApp: true,
    email: false,
  },
  {
    kind: 'Support',
    description: 'Tickets assigned to you, and yours coming due',
    inApp: true,
    email: false,
  },
  {
    kind: 'Mandate',
    description: 'HUF mandates approved or rejected by the bank',
    inApp: true,
    email: false,
  },
  {
    kind: 'Investor',
    description: 'The daily sign-up count, and investors ready to invest who haven’t',
    inApp: true,
    email: false,
  },
];

export const DefaultWorkspacePreferences: WorkspacePreferences = {
  landingPage: '/dashboard',
  sidebarCollapsed: false,
  dateFormat: 'DD MMM YYYY',
  density: 'Comfortable',
  digest: 'Daily',
  quietHoursFrom: '21:00',
  quietHoursTo: '08:00',
};

export const LandingPages = [
  { label: 'Dashboard', value: '/dashboard' },
  { label: 'Inbox', value: '/notifications' },
  { label: 'Compliance', value: '/compliance' },
  { label: 'Investors', value: '/investors' },
  { label: 'Model Portfolios', value: '/model-portfolios' },
];

export const ActiveSessions: SessionRecord[] = [
  {
    id: 'ss-01',
    device: 'Windows 11',
    browser: 'Chrome 128',
    location: 'Delhi NCR, IN',
    lastActive: 'Active now',
    current: true,
  },
  {
    id: 'ss-02',
    device: 'iPhone 15',
    browser: 'RiSips app',
    location: 'Delhi NCR, IN',
    lastActive: '2 hours ago',
    current: false,
  },
  {
    id: 'ss-03',
    device: 'MacBook Pro',
    browser: 'Safari 18',
    location: 'Mumbai, IN',
    lastActive: '28 Aug 2026',
    current: false,
  },
];

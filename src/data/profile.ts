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
    kind: 'Compliance',
    description: 'KYC rejections, re-KYC due, nominee declarations outstanding',
    inApp: true,
    email: true,
  },
  {
    kind: 'Mandate',
    description: 'Bounced debits and mandates that need re-registering',
    inApp: true,
    email: true,
  },
  {
    kind: 'Agent',
    description: 'Licence expiries and agents flagged for review',
    inApp: true,
    email: false,
  },
  {
    kind: 'Portfolio',
    description: 'Drafts awaiting publish and allocation guardrail breaches',
    inApp: true,
    email: false,
  },
  {
    kind: 'Investor',
    description: 'Large redemptions, new onboardings, profile changes',
    inApp: false,
    email: false,
  },
  {
    kind: 'Meeting',
    description: 'Upcoming review meetings and notes captured by agents',
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

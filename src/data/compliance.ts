import type { ReviewMeeting } from '@/types/compliance.types';

export const ReviewMeetings: ReviewMeeting[] = [
  {
    id: 'rm-01',
    investorName: 'Ananya Sharma',
    investorId: 'in-01',
    conductedBy: 'Simmi Puri',
    mode: 'In-person',
    meetingDate: '2026-08-28',
    currentProfile: 'Moderate',
    recommendedProfile: 'Aggressive',
    notes:
      'Income up after promotion, horizon extended to 15 years. Comfortable with a deeper drawdown. Move to Long Horizon Equity from October cycle and step SIP to ₹35,000.',
    status: 'Profile Updated',
  },
  {
    id: 'rm-02',
    investorName: 'Fatima Qureshi',
    investorId: 'in-03',
    conductedBy: 'Aakash Mehta',
    mode: 'Video',
    meetingDate: '2026-08-22',
    currentProfile: 'Conservative',
    recommendedProfile: 'Conservative',
    notes:
      'Two delayed SIPs traced to salary date change. Shifted debit date to the 7th. No change to the basket.',
    status: 'Captured',
  },
  {
    id: 'rm-03',
    investorName: 'Rajeev Malhotra',
    investorId: 'in-04',
    conductedBy: 'Priya Nair',
    mode: 'In-person',
    meetingDate: '2026-09-09',
    currentProfile: 'Aggressive',
    recommendedProfile: 'Aggressive',
    notes: 'Annual review. Re-KYC documents to be collected at the meeting.',
    status: 'Scheduled',
  },
  {
    id: 'rm-04',
    investorName: 'Arjun Pillai',
    investorId: 'in-08',
    conductedBy: 'Sneha Iyer',
    mode: 'Phone',
    meetingDate: '2026-08-14',
    currentProfile: 'Moderate',
    recommendedProfile: 'Conservative',
    notes:
      'Planning a house purchase in 3 years. Wants the equity share trimmed and a liquid sleeve added for the down payment.',
    status: 'Captured',
  },
];

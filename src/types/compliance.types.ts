export type AlertSeverity = 'High' | 'Medium' | 'Low';

export type ReviewMeeting = {
  id: string;
  investorName: string;
  investorId: string;
  conductedBy: string;
  mode: 'In-person' | 'Video' | 'Phone';
  meetingDate: string;
  currentProfile: string;
  recommendedProfile: string;
  notes: string;
  status: 'Captured' | 'Profile Updated' | 'Scheduled';
};

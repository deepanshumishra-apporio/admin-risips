// The admin API's response shapes. Mirrors backend/src/types/staff.types.ts and
// admin-investor.types.ts; keep the two in step when either changes.

// --- staff & sessions -------------------------------------------------------

export type Permission =
  | 'dashboard.read'
  | 'investors.read'
  | 'reports.read'
  | 'transactions.read'
  | 'support.manage'
  | 'compliance.manage'
  | 'announcements.manage'
  | 'portfolios.manage'
  | 'meetings.manage'
  | 'staff.manage'
  | 'roles.manage';

export type MfaState = 'SETUP_REQUIRED' | 'VERIFY_REQUIRED' | 'VERIFIED';

export type StaffSession = {
  accessToken: string;
  tokenType: 'Bearer';
  expiresAt: string;
  mfa: MfaState;
};

export type StaffSessionState = {
  expiresAt: string;
  mfa: MfaState;
  mustChangePassword: boolean;
};

export type MfaSetup = {
  secret: string;
  otpauthUri: string;
};

export type StaffMe = {
  id: string;
  email: string;
  fullName: string;
  roles: { key: string; name: string }[];
  permissions: Permission[];
  mustChangePassword: boolean;
  lastLoginAt: string | null;
};

// --- investors ------------------------------------------------------------------

export const KycStatuses = ['NOT_STARTED', 'PAN_CHECK_FAILED', 'IN_PROGRESS', 'FAILED', 'EXPIRED', 'COMPLETED'] as const;
export type KycStatus = (typeof KycStatuses)[number];

export const JourneyStages = [
  'SIGNED_UP',
  'KYC',
  'KYC_COMPLETED',
  'PROFILE',
  'ACCOUNT_SETUP',
  'READY_TO_INVEST',
  'INVESTED',
] as const;
export type JourneyStage = (typeof JourneyStages)[number];

export type KycNextStep = 'PROVIDE_DETAILS' | 'FETCH_PROOF' | 'UPLOAD_SIGNATURE' | 'ESIGN' | 'WAITING_ON_PROVIDER';

export type CountByKey<K extends string = string> = { key: K; label: string; count: number };

export type DashboardSummary = {
  generatedAt: string;
  /** When investor counts were last brought up to date; null until the first projection run. */
  dataAsOf: string | null;
  signups: { total: number; today: number; last7Days: number; last30Days: number };
  usersByStatus: CountByKey[];
  kyc: {
    byStatus: CountByKey<KycStatus>[];
    completed: number;
    completedVia: { kra: number; kycForm: number };
    inProgressByStep: CountByKey<KycNextStep>[];
  };
  journey: { byStage: CountByKey<JourneyStage>[] };
  funnel: CountByKey[];
  attention: {
    kycStalled: number;
    kycFailedOrExpired: number;
    panCheckFailed: number;
    accountNotReady: number;
  };
  investments: {
    investedInvestors: number;
    successfulPurchases: number;
    purchasedAmount: string;
    currentValue: string;
    activeSips: number;
    activeSipMonthlyAmount: string;
    mandatesByStatus: CountByKey[];
  };
};

export type SignupBucket = 'day' | 'week' | 'month';

export type SignupSeries = {
  bucket: SignupBucket;
  from: string;
  to: string;
  points: { date: string; signups: number; kycCompleted: number }[];
};

export type InvestorListItem = {
  id: string;
  name: string | null;
  email: string | null;
  phone: string;
  status: string;
  pan: string | null;
  stage: JourneyStage;
  kycStatus: KycStatus;
  kycCompletedVia: 'KRA' | 'KYC_FORM' | null;
  kycNextStep: KycNextStep | null;
  investedAmount: string;
  currentValue: string;
  activeSips: number;
  sipMonthlyAmount: string;
  nextSipDate: string | null;
  signedUpAt: string;
  lastLoginAt: string | null;
  lastActivityAt: string;
};

export type InvestorList = {
  items: InvestorListItem[];
  total: number;
  nextCursor: string | null;
};

export type InvestorListQuery = {
  search?: string;
  stage?: JourneyStage[];
  kycStatus?: KycStatus[];
  kycStalled?: boolean;
  sipDueDays?: number;
  cursor?: string;
  limit?: number;
};

type Check = { status: string | null; code: string | null };

export type InvestorDetail = {
  summary: InvestorListItem;
  user: { emailVerifiedAt: string | null; phoneVerifiedAt: string | null; createdAt: string };
  kyc: {
    panCheck: {
      at: string;
      readinessStatus: string | null;
      readinessCode: string | null;
      readinessReason: string | null;
      pan: Check;
      name: Check;
      dateOfBirth: Check;
    } | null;
    forms: {
      id: string;
      type: string;
      status: string;
      reason: string | null;
      nextStep: KycNextStep | null;
      proofStatus: string | null;
      esignStatus: string | null;
      signatureProvided: boolean;
      outstandingFields: string[];
      createdAt: string;
      submittedAt: string | null;
      failedAt: string | null;
      expiresAt: string | null;
    }[];
  };
  profile: {
    id: string;
    name: string | null;
    dateOfBirth: string | null;
    gender: string | null;
    occupation: string | null;
    taxStatus: string | null;
    incomeSlab: string | null;
    addresses: { city: string | null; state: string | null; postalCode: string; country: string }[];
  } | null;
  bankAccounts: {
    id: string;
    bankName: string | null;
    accountNumber: string;
    ifscCode: string;
    type: string;
    isPayout: boolean;
    verificationStatus: string | null;
    verificationConfidence: string | null;
    verifiedAt: string | null;
  }[];
  nomination: { optedOut: boolean; nominees: { name: string; relationship: string; allocationPercentage: string }[] };
  mandates: { id: string; type: string; status: string; limit: string; approvedAt: string | null; createdAt: string }[];
  investments: InvestorInvestments;
  timeline: { at: string; event: string }[];
};

// --- staff management ----------------------------------------------------------

export type StaffStatus = 'ACTIVE' | 'SUSPENDED' | 'DEACTIVATED';

export type Role = {
  key: string;
  name: string;
  description: string | null;
  isSystem: boolean;
  permissions: Permission[];
  staffCount: number;
};

export type PermissionInfo = {
  key: Permission;
  description: string;
};

export type StaffListItem = {
  id: string;
  email: string;
  fullName: string;
  phone: string | null;
  status: StaffStatus;
  roles: { key: string; name: string }[];
  mfaEnrolled: boolean;
  locked: boolean;
  mustChangePassword: boolean;
  lastLoginAt: string | null;
  createdAt: string;
};

export type StaffDetail = StaffListItem & {
  createdBy: { id: string; fullName: string } | null;
  deactivatedAt: string | null;
  activeSessions: number;
  recentLogins: { outcome: string; ipAddress: string | null; userAgent: string | null; at: string }[];
};

export type TemporaryPassword = { staff: StaffListItem; temporaryPassword: string };

// --- an investor's money ---------------------------------------------------------

export type PlanKind = 'SIP' | 'SWP' | 'STP';
export type OrderKind = 'PURCHASE' | 'REDEMPTION' | 'SWITCH';
export type OrderSource = 'ONE_TIME' | PlanKind;

export type Holding = {
  id: string;
  scheme: string;
  isin: string;
  folioNumber: string;
  units: string;
  redeemableUnits: string | null;
  nav: string | null;
  navAsOn: string | null;
  currentValue: string | null;
  investedValue: string | null;
  gain: string | null;
};

export type Plan = {
  id: string;
  kind: PlanKind;
  scheme: string;
  toScheme: string | null;
  amount: string | null;
  units: string | null;
  frequency: string;
  installmentDay: number | null;
  state: string;
  startDate: string | null;
  endDate: string | null;
  nextInstallmentDate: string | null;
  previousInstallmentDate: string | null;
  totalInstallments: number;
  remainingInstallments: number | null;
  installmentsPlaced: number;
  installmentsSucceeded: number;
  pause: { state: string | null; from: string | null; to: string | null } | null;
  mandate: { type: string; status: string } | null;
  folioNumber: string | null;
  createdAt: string;
  cancelledAt: string | null;
  reason: string | null;
};

export type UpcomingInstallment = {
  planId: string;
  kind: PlanKind;
  scheme: string;
  toScheme: string | null;
  date: string;
  amount: string | null;
  units: string | null;
  mandateReady: boolean | null;
  paused: boolean;
};

export type Order = {
  id: string;
  kind: OrderKind;
  source: OrderSource;
  scheme: string;
  toScheme: string | null;
  amount: string | null;
  units: string | null;
  processedAmount: string | null;
  processedUnits: string | null;
  price: string | null;
  folioNumber: string | null;
  state: string;
  failureReason: string | null;
  placedAt: string;
  completedAt: string | null;
};

export type Payment = {
  id: string;
  type: string;
  method: string | null;
  status: string;
  amount: string;
  failureReason: string | null;
  createdAt: string;
  settledAt: string | null;
};

export type InvestorInvestments = {
  portfolio: {
    currentValue: string;
    investedValue: string;
    gain: string;
    gainPercent: string | null;
    asOf: string | null;
    holdings: Holding[];
  };
  folios: { number: string; amcCode: string | null; holdingPattern: string | null; schemes: number }[];
  plans: { sips: Plan[]; swps: Plan[]; stps: Plan[] };
  summary: {
    activeSips: number;
    sipMonthlyAmount: string;
    activeSwps: number;
    activeStps: number;
    nextSip: { date: string; amount: string; count: number } | null;
  };
  upcoming: UpcomingInstallment[];
  orders: Order[];
  orderTotals: { purchased: string; redeemed: string; switched: string; inFlight: number; failed: number };
  payments: Payment[];
};

// --- one item, for the side panel ---------------------------------------------------

export type InvestorItemType = 'holding' | 'sip' | 'swp' | 'stp' | 'purchase' | 'redemption' | 'switch' | 'payment';

export type ItemEvent = { at: string; label: string };

export type SchemeFacts = {
  isin: string;
  name: string;
  amc: string;
  category: string;
  subCategory: string | null;
  planType: string;
  option: string;
  latestNav: string | null;
  latestNavDate: string | null;
  expenseRatio: string | null;
  exitLoadPercent: string | null;
  lockInDays: number | null;
};

export type OrderDetail = Order & {
  fpId: string;
  sourceRefId: string | null;
  gateway: string | null;
  subtype: string | null;
  failureCode: string | null;
  navDate: string | null;
  scheduledOn: string | null;
  tradedOn: string | null;
  initiatedBy: string | null;
  initiatedVia: string | null;
  consent: { at: string; email: string | null; mobile: string | null } | null;
  payoutAccount: { accountNumber: string; ifsc: string | null } | null;
  plan: { id: string; kind: PlanKind; scheme: string } | null;
  payments: Payment[];
  events: ItemEvent[];
  schemeFacts: SchemeFacts;
};

export type PlanDetail = Plan & {
  fpId: string;
  gateway: string | null;
  requestedActivationDate: string | null;
  activatedAt: string | null;
  completedAt: string | null;
  failedAt: string | null;
  autoCancelled: boolean | null;
  cancellationCode: string | null;
  cancellationScheduledOn: string | null;
  consentAt: string | null;
  paymentMethod: string | null;
  purpose: string | null;
  installments: Order[];
  events: ItemEvent[];
  schemeFacts: SchemeFacts;
};

export type HoldingDetail = Holding & {
  unitsAsOn: string | null;
  currentValueAsOn: string | null;
  investedValueAsOn: string | null;
  payoutAmount: string | null;
  schemeFacts: SchemeFacts | null;
  folio: { number: string; amcCode: string | null; holdingPattern: string | null } | null;
  orders: Order[];
  plans: { id: string; kind: PlanKind; state: string; amount: string | null; frequency: string; nextInstallmentDate: string | null }[];
};

export type PaymentDetail = Payment & {
  fpId: number;
  provider: string | null;
  debitDate: string | null;
  failureCode: string | null;
  lateAuth: boolean | null;
  refund: { status: string | null; reference: string | null; reason: string | null; at: string | null } | null;
  mandate: { type: string; status: string; umrn: string | null } | null;
  bankAccount: { bankName: string | null; accountNumber: string } | null;
  purchases: Order[];
  events: ItemEvent[];
};

export type InvestorItem =
  | { type: 'holding'; holding: HoldingDetail }
  | { type: 'plan'; plan: PlanDetail }
  | { type: 'order'; order: OrderDetail }
  | { type: 'payment'; payment: PaymentDetail };

// --- reports -------------------------------------------------------------------

export type ReportKey = 'investors' | 'kyc' | 'transactions' | 'plans' | 'payments' | 'aum' | 'compliance';

export type ReportColumnKind = 'text' | 'money' | 'units' | 'count' | 'date' | 'datetime';

export type ReportColumn = { key: string; label: string; kind: ReportColumnKind };

/** Money and units arrive as decimal strings, dates as ISO strings. */
export type ReportCell = string | number | null;

export type ReportDefinition = {
  key: ReportKey;
  name: string;
  description: string;
  /** What the date range filters on; null for a point-in-time report. */
  dateField: string | null;
  statusLabel: string | null;
  statuses: { value: string; label: string }[];
  columns: ReportColumn[];
};

export type ReportFilters = { from?: string; to?: string; status?: string };

export type ReportResult = {
  report: ReportKey;
  name: string;
  columns: ReportColumn[];
  rows: Record<string, ReportCell>[];
  total: number;
  limit: number;
  truncated: boolean;
  filters: ReportFilters;
  generatedAt: string;
};

// --- transaction monitoring ---------------------------------------------------------

export type OrderType = 'PURCHASE' | 'SIP_INSTALLMENT' | 'REDEMPTION' | 'SWP_INSTALLMENT' | 'SWITCH' | 'STP_INSTALLMENT';

export type MonitorOrderState =
  | 'UNDER_REVIEW'
  | 'PENDING'
  | 'CONFIRMED'
  | 'SUBMITTED'
  | 'SUCCESSFUL'
  | 'FAILED'
  | 'CANCELLED'
  | 'REVERSED';

export type OrderFlag = 'FAILED' | 'PAID_NOT_CONFIRMED' | 'NOT_SUBMITTED' | 'STUCK_AT_RTA' | 'AWAITING_INVESTOR';

export type MonitoredOrder = {
  id: string;
  kind: 'purchase' | 'redemption' | 'switch';
  type: OrderType;
  investor: { id: string | null; name: string | null; pan: string | null };
  scheme: string;
  toScheme: string | null;
  folio: string | null;
  amount: string | null;
  units: string | null;
  state: MonitorOrderState;
  gateway: string;
  payment: { status: string; at: string | null } | null;
  flag: OrderFlag | null;
  failureReason: string | null;
  placedAt: string;
  updatedAt: string;
  completedAt: string | null;
};

export type TransactionList = { items: MonitoredOrder[]; nextCursor: string | null };

export type TransactionListQuery = {
  type?: OrderType[];
  state?: MonitorOrderState[];
  flag?: OrderFlag[];
  attention?: boolean;
  from?: string;
  to?: string;
  search?: string;
  cursor?: string;
  limit?: number;
};

export type TransactionSummary = {
  generatedAt: string;
  today: { placed: number; successful: number; failed: number; purchaseAmount: string; redemptionAmount: string };
  inFlight: number;
  attention: { key: OrderFlag; label: string; count: number }[];
  paymentsToday: { successful: number; failed: number; pending: number; amountCollected: string };
  topFailures: { reason: string; count: number }[];
  daily: { date: string; placed: number; successful: number; failed: number }[];
};

// --- support: tickets ---------------------------------------------------------------

export type TicketStatus = 'OPEN' | 'IN_PROGRESS' | 'WAITING_ON_INVESTOR' | 'RESOLVED' | 'CLOSED';
export type TicketPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
export type TicketCategory = 'KYC' | 'SIP_MANDATE' | 'ORDER' | 'REDEMPTION' | 'PAYMENT' | 'STATEMENT' | 'ACCOUNT' | 'OTHER';
export type TicketChannel = 'APP' | 'CHAT' | 'PHONE' | 'EMAIL';

export type StaffRef = { id: string; name: string };

export type SupportInvestor = {
  id: string;
  name: string | null;
  phone: string | null;
  email: string | null;
  pan: string | null;
};

export type TicketListItem = {
  id: string;
  reference: string;
  subject: string;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  channel: TicketChannel;
  investor: SupportInvestor;
  assignee: StaffRef | null;
  slaDueAt: string;
  overdue: boolean;
  awaitingStaff: boolean;
  lastMessageAt: string;
  createdAt: string;
};

export type TicketMessage = {
  id: string;
  author: 'INVESTOR' | 'STAFF' | 'SYSTEM';
  staffName: string | null;
  body: string;
  internal: boolean;
  createdAt: string;
};

export type TicketEvent = {
  id: string;
  type: string;
  actor: 'INVESTOR' | 'STAFF' | 'SYSTEM';
  staffName: string | null;
  from: string | null;
  to: string | null;
  createdAt: string;
};

export type TicketDetail = TicketListItem & {
  related: { type: 'order' | 'plan' | 'payment'; id: string } | null;
  chatConversationId: string | null;
  firstResponseAt: string | null;
  resolvedAt: string | null;
  closedAt: string | null;
  openedBy: StaffRef | null;
  messages: TicketMessage[];
  events: TicketEvent[];
};

export type TicketSummary = {
  open: number;
  unassigned: number;
  overdue: number;
  awaitingStaff: number;
  waitingOnInvestor: number;
  mine: number;
};

export type TicketList = { items: TicketListItem[]; total: number; nextCursor: string | null; summary: TicketSummary };

export type TicketListQuery = {
  status?: TicketStatus[];
  priority?: TicketPriority[];
  category?: TicketCategory[];
  assignee?: string;
  overdue?: boolean;
  search?: string;
  cursor?: string;
  limit?: number;
};

// --- support: chat ------------------------------------------------------------------

export type ChatHandler = 'BOT' | 'HUMAN';
export type ChatStatus = 'OPEN' | 'WAITING_FOR_AGENT' | 'CLOSED';
export type ChatSender = 'INVESTOR' | 'BOT' | 'STAFF' | 'SYSTEM';
export type ChatView = 'live' | 'waiting' | 'mine' | 'bot' | 'closed';

export type ChatMessage = {
  id: string;
  sender: ChatSender;
  staffName: string | null;
  body: string;
  intent: string | null;
  createdAt: string;
};

export type ChatListItem = {
  id: string;
  investor: SupportInvestor;
  handler: ChatHandler;
  status: ChatStatus;
  assignee: StaffRef | null;
  lastIntent: string | null;
  lastMessage: { sender: ChatSender; body: string; at: string } | null;
  unreadByStaff: boolean;
  handoverRequestedAt: string | null;
  messageCount: number;
  ticket: { id: string; reference: string } | null;
  createdAt: string;
};

export type ChatDetail = ChatListItem & { messages: ChatMessage[]; closedAt: string | null };

export type ChatList = { items: ChatListItem[]; summary: { live: number; waiting: number; mine: number; bot: number } };

// --- compliance alerts ----------------------------------------------------------------

export type ComplianceKind =
  | 'KYC_STALLED'
  | 'KYC_FAILED'
  | 'SIP_FAILURES'
  | 'MANDATE_REJECTED'
  | 'MANDATE_PENDING'
  | 'PAID_NOT_ALLOTTED'
  | 'ORDER_STUCK'
  | 'NOMINEE_MISSING';
export type ComplianceSeverity = 'HIGH' | 'MEDIUM' | 'LOW';
export type ComplianceStatus = 'OPEN' | 'ACKNOWLEDGED' | 'RESOLVED' | 'DISMISSED';

export type ComplianceAlertItem = {
  id: string;
  kind: ComplianceKind;
  severity: ComplianceSeverity;
  status: ComplianceStatus;
  title: string;
  detail: string;
  investor: SupportInvestor | null;
  entity: { type: 'order' | 'plan' | 'mandate' | 'account'; id: string } | null;
  assignee: StaffRef | null;
  firstDetectedAt: string;
  lastDetectedAt: string;
  ageDays: number;
  resolvedAt: string | null;
  autoResolved: boolean;
};

export type ComplianceAlertDetail = ComplianceAlertItem & {
  resolution: string | null;
  resolvedBy: StaffRef | null;
  lastRemindedAt: string | null;
  canRemind: boolean;
  events: { id: string; type: string; staffName: string | null; note: string | null; createdAt: string }[];
};

export type ComplianceSummary = {
  open: number;
  high: number;
  ageingOver7Days: number;
  unassigned: number;
  byKind: { key: ComplianceKind; label: string; count: number }[];
  resolvedLast30Days: number;
  medianHoursToClose: number | null;
  lastScanAt: string | null;
};

export type ComplianceList = { items: ComplianceAlertItem[]; nextCursor: string | null; summary: ComplianceSummary };

export type ComplianceListQuery = {
  status?: ComplianceStatus[];
  kind?: ComplianceKind[];
  severity?: ComplianceSeverity[];
  assignee?: string;
  search?: string;
  cursor?: string;
  limit?: number;
};

export type ComplianceScanResult = {
  mode: 'ran' | 'skipped';
  detected: number;
  raised: number;
  reopened: number;
  autoResolved: number;
  at: string;
};

// --- announcements --------------------------------------------------------------------

export type AnnouncementCategory = 'PROMOTIONAL' | 'INFORMATIONAL';
export type AnnouncementAudience = 'ALL_INVESTORS' | 'KYC_PENDING' | 'READY_NOT_INVESTED' | 'INVESTED' | 'ACTIVE_SIP' | 'NO_SIP';
export type AnnouncementStatus = 'DRAFT' | 'PENDING_APPROVAL' | 'REJECTED' | 'SCHEDULED' | 'LIVE' | 'COMPLETED' | 'CANCELLED';
export type CtaAction = 'start_sip' | 'invest' | 'sips' | 'none';

export type AnnouncementInput = {
  name: string;
  category: AnnouncementCategory;
  audience: AnnouncementAudience;
  title: string;
  body: string;
  sendNotification: boolean;
  showBanner: boolean;
  tag: string | null;
  bannerTitle: string | null;
  bannerBody: string | null;
  highlight: string | null;
  ctaLabel: string | null;
  ctaAction: CtaAction | null;
  /** ISO instant. */
  startsAt: string;
  endsAt: string | null;
};

export type AnnouncementListItem = {
  id: string;
  name: string;
  category: AnnouncementCategory;
  audience: AnnouncementAudience;
  status: AnnouncementStatus;
  title: string;
  sendNotification: boolean;
  showBanner: boolean;
  startsAt: string;
  endsAt: string | null;
  createdBy: StaffRef | null;
  approvedBy: StaffRef | null;
  sentAt: string | null;
  deliveredCount: number;
  createdAt: string;
};

export type AnnouncementDetail = AnnouncementListItem & {
  body: string;
  tag: string | null;
  bannerTitle: string | null;
  bannerBody: string | null;
  highlight: string | null;
  ctaLabel: string | null;
  ctaAction: CtaAction | null;
  submittedAt: string | null;
  approvedAt: string | null;
  rejectionReason: string | null;
  cancelledAt: string | null;
  stats: { targeted: number; delivered: number; optedOut: number; capped: number; read: number; bannerSeen: number; bannerClicked: number };
  can: { edit: boolean; submit: boolean; approve: boolean; reject: boolean; cancel: boolean; end: boolean };
};

export type AnnouncementList = {
  items: AnnouncementListItem[];
  summary: { drafts: number; awaitingApproval: number; scheduled: number; live: number };
};

export type AudienceReach = { matched: number; optedOut: number; reachable: number };

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
  | 'hufs.manage'
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

/** A HUF is its own investor (its own PAN, bank and folios), added from the karta's login and run by the karta. */
export const AccountTypes = ['INDIVIDUAL', 'HUF'] as const;
export type AccountType = (typeof AccountTypes)[number];

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
  /** Absent from an API that predates HUFs. */
  accountTypes?: CountByKey<AccountType>[];
  funnel: CountByKey[];
  funnelByAccountType?: Record<AccountType, CountByKey[]>;
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
  /** Absent from an API that predates HUFs: an individual. */
  accountType?: AccountType;
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

/** KYC: blocked in KYC. SETUP: KYC done but the account is not ready to transact. */
export const InvestorAttentions = ['KYC', 'SETUP'] as const;
export type InvestorAttention = (typeof InvestorAttentions)[number];

export type InvestorOverview = {
  total: number;
  byStage: Record<JourneyStage, number>;
  byAccountType?: Record<AccountType, number>;
  kycPending: number;
  kycStalled: number;
  attention: Record<InvestorAttention, number>;
  /** Null when it could not be counted (an older API, without the dashboard permission). */
  activeSips: number | null;
  sipDueIn7Days: number;
  /**
   * Counted by the admin from list totals, because the API predates the
   * overview. Its list cannot filter by "needs attention" either, so those
   * links go to the whole stage instead.
   */
  countedFromList?: boolean;
};

export type NudgeResult = {
  sent: number;
  skippedInvested: number;
  skippedOptedOut: number;
  skippedRecent: number;
};

export type InvestorListQuery = {
  search?: string;
  stage?: JourneyStage[];
  kycStatus?: KycStatus[];
  accountType?: AccountType[];
  kycStalled?: boolean;
  sipDueDays?: number;
  attention?: InvestorAttention;
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
  nomination: {
    /** A HUF can't nominate. */
    notApplicable?: boolean;
    optedOut: boolean;
    nominees: { name: string; relationship: string; allocationPercentage: string }[];
  };
  mandates: { id: string; type: string; status: string; limit: string; approvedAt: string | null; createdAt: string }[];
  /** HUF only. */
  huf?: HufDetails | null;
  /** The investor's registration on NSE Invest, when the app backend sends it. */
  nse?: NseRegistration | null;
  investments: InvestorInvestments;
  timeline: { at: string; event: string }[];
};

export type HufDetails = {
  formedOn: string | null;
  natureOfBusiness: string | null;
  /** The karta's own investor record. */
  karta: { id: string; name: string | null; pan: string | null } | null;
  coparceners: { name: string; relationship: string; dateOfBirth: string | null }[];
};

export type FatcaRegistrarStatus = { status: 'NOT_SENT' | 'PENDING' | 'ACCEPTED' | 'REJECTED'; remark: string | null };

export type NseRegistration = {
  clientCode: string | null;
  registeredAt: string | null;
  /** NSE's own bank check: PENDING, then ACTIVE (or a rejection). */
  bankStatus: string | null;
  bankRemark: string | null;
  fatca: { cams: FatcaRegistrarStatus; kfin: FatcaRegistrarStatus } | null;
  /** Null when unknown: NSE's authorisation report returns nothing for HUFs. */
  authorised: boolean | null;
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
  /** True when the investor redeemed or switched their whole holding; amount and units are null then. */
  allUnits?: boolean;
  /** Open all-units orders only: units held × latest NAV. */
  estimatedAmount?: string | null;
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
  allUnits?: boolean;
  estimatedAmount?: string | null;
  processedAmount?: string | null;
  processedUnits?: string | null;
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
  | 'NOMINEE_MISSING'
  | 'REDEMPTION_PAYOUT_PENDING'
  | 'REFUND_PENDING'
  | 'CONSENT_MISSING'
  | 'KYC_NOT_COMPLIANT'
  | 'PEP_INVESTOR'
  | 'LARGE_TRANSACTION'
  | 'RAPID_ROUND_TRIP'
  | 'COMPLAINT_OVERDUE'
  | 'PAYOUT_BANK_UNVERIFIED'
  | 'CONTACT_MISSING'
  | 'MONITORING_STALE'
  | 'FATCA_REJECTED';
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
  entity: { type: 'order' | 'plan' | 'mandate' | 'account' | 'ticket'; id: string } | null;
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

// --- review meetings -----------------------------------------------------------------

export type MeetingMode = 'IN_PERSON' | 'VIDEO' | 'PHONE';
export type RiskProfile = 'CONSERVATIVE' | 'MODERATE' | 'AGGRESSIVE';
export type MeetingStatus = 'SCHEDULED' | 'CAPTURED' | 'PROFILE_UPDATED';

export type ReviewMeetingItem = {
  id: string;
  investor: SupportInvestor;
  conductedBy: StaffRef;
  recordedBy: StaffRef;
  mode: MeetingMode;
  /** yyyy-mm-dd */
  meetingDate: string;
  currentProfile: RiskProfile;
  recommendedProfile: RiskProfile;
  status: MeetingStatus;
  notes: string;
  createdAt: string;
  updatedAt: string;
};

export type ReviewMeetingList = {
  items: ReviewMeetingItem[];
  nextCursor: string | null;
  counts: Record<MeetingStatus, number>;
};

export type MeetingInvestorOption = { id: string; name: string | null; phone: string | null };

// --- HUF onboarding on NSE ---------------------------------------------------------

export const HufStatuses = ['DRAFT', 'AWAITING_CONSENT', 'CONSENTED', 'SUBMITTING', 'NSE_FAILED', 'AWAITING_KARTA', 'ACTIVE', 'CANCELLED'] as const;
export type HufStatus = (typeof HufStatuses)[number];

/** What staff enter. Dates are yyyy-mm-dd. */
export type HufDetailsInput = {
  clientCode: string;
  hufName: string;
  pan: string;
  formedOn: string;
  placeOfFormation: string;
  natureOfBusiness: string;
  incomeSlab: string;
  netWorthLakhs: string;
  netWorthDate: string;
  email: string;
  mobile: string;
  accountType: 'SB' | 'CB';
  accountNo: string;
  ifsc: string;
  bankHolderName: string;
  address1: string;
  address2: string;
  address3: string;
  city: string;
  state: string;
  pincode: string;
  karta: { name: string; pan: string; dateOfBirth: string; gender: 'M' | 'F' | 'O' | ''; fatherName: string };
  coparceners: { name: string; relationship: string; dateOfBirth: string | null }[];
};

export type HufRegistrarStatus = { status: 'NOT_SENT' | 'PENDING' | 'ACCEPTED' | 'REJECTED'; remark: string | null };

export const HufDocumentKinds = ['AOF', 'FATCA_FORM', 'CANCELLED_CHEQUE'] as const;
export type HufDocumentKind = (typeof HufDocumentKinds)[number];
/** The last copy sent to NSE. The file isn't kept: only what identifies it, and NSE's answer. */
export type HufDocument = {
  ok: boolean;
  status: string;
  remark: string | null;
  fileName: string;
  contentType: string;
  bytes: number;
  sha256: string;
  uploadedAt: string;
  uploadedBy: string;
};
export type HufNseStep = { ok: boolean; status: string; remark: string | null; at: string } | null;

export type HufListItem = {
  id: string;
  clientCode: string;
  hufName: string;
  pan: string;
  kartaName: string;
  status: HufStatus;
  /** ADMIN: prepared here. NSE: registered on NSE directly (e.g. its portal) and found by the sync. */
  source: 'ADMIN' | 'NSE';
  bankStatus: string | null;
  fatca: { cams: HufRegistrarStatus['status']; kfin: HufRegistrarStatus['status'] } | null;
  createdBy: { id: string; name: string } | null;
  approvedBy: { id: string; name: string } | null;
  createdAt: string;
  updatedAt: string;
};

export type HufList = { items: HufListItem[]; nextCursor: string | null; counts: Record<HufStatus, number> };

export type HufDetail = HufListItem & {
  /** Full while the HUF can still be edited; masked once it is on NSE. */
  details: HufDetailsInput;
  consent: { state: 'NONE' | 'PENDING' | 'EXPIRED' | 'GIVEN'; at: string | null; ip: string | null; expiresAt: string | null };
  steps: { duplicateCheck: { at: string; codes: string[] } | null; ucc: HufNseStep; fatca: HufNseStep };
  nse: {
    bankStatus: string | null;
    bankRemark: string | null;
    fatca: { cams: HufRegistrarStatus; kfin: HufRegistrarStatus } | null;
    authorised: boolean | null;
    /** The signed AOF at CAMS and KFin; null until one is uploaded. */
    aof?: { cams: HufRegistrarStatus; kfin: HufRegistrarStatus; uploadedAt: string | null } | null;
    checkedAt: string;
  } | null;
  documents: Partial<Record<HufDocumentKind, HufDocument>>;
  canUploadDocuments: boolean;
  authLink: string | null;
  authLinkError: string | null;
  lastError: string | null;
  problems: string[];
  approvedAt: string | null;
  canEdit: boolean;
  canCancel: boolean;
  canRequestConsent: boolean;
  /** Why this staff member can't approve it now; null when they can (or approval isn't the next step). */
  approval: string | null;
  events: { id: string; type: string; staffName: string | null; note: string | null; createdAt: string }[];
};

export type HufOptions = {
  nextClientCode: string;
  states: { code: string; name: string }[];
  incomeSlabs: { code: string; label: string }[];
  nse: { environment: 'UAT' | 'LIVE'; configured: boolean; liveAllowed: boolean };
  secondApprover: boolean;
  /** When HUFs registered on NSE directly were last looked for. */
  lastSyncAt: string | null;
};

/** What the karta sees on the consent page: nothing in full. */
export type HufConsentView = {
  state: 'PENDING' | 'EXPIRED' | 'GIVEN' | 'NONE';
  agreedAt: string | null;
  expiresAt: string | null;
  huf: {
    name: string;
    pan: string;
    formedOn: string;
    kartaName: string;
    kartaPan: string;
    email: string;
    mobile: string;
    bank: { ifsc: string; accountNo: string; holder: string };
    address: string;
    coparceners: { name: string; relationship: string }[];
  };
};

// --- a HUF's investments on NSE ----------------------------------------------------

export type HufSipRule = {
  dates: number[];
  minAmount: number | null;
  maxAmount: number | null;
  multiplier: number | null;
  minInstallments: number | null;
  maxInstallments: number | null;
  minGapDays: number | null;
};

export type HufScheme = {
  schemeCode: string;
  name: string;
  isin: string;
  type: string;
  minFresh: number | null;
  minAdditional: number | null;
  multiplier: number | null;
  cutoff: string;
  nav: number | null;
  navDate: string | null;
  sipAllowed: boolean;
  sipMonthly: HufSipRule | null;
  amcCode: string;
  amcName: string;
  rta: string;
  plan: string | null;
  purchaseAllowed: boolean;
  redemptionAllowed: boolean;
  redemptionMinAmount: number | null;
  exitLoad: string | null;
  lockInDays: number | null;
  launchedOn: string | null;
  openEnded: boolean | null;
  settlement: string | null;
  /** From AMFI's NAV file, matched by ISIN; null when AMFI doesn't list it. */
  amfiCode?: string | null;
  /** AMFI's name for the fund, in its own case (NSE's is all capitals). */
  displayName?: string | null;
  assetClass?: string | null;
  category?: string | null;
  structure?: string | null;
  planName?: 'Direct' | 'Regular';
  option?: 'Growth' | 'IDCW';
};

export type HufFacet = { name: string; count: number };

/** GET /hufs/funds: every fund open for purchase on NSE, filtered and paged. */
export type HufFundList = {
  items: HufScheme[];
  total: number;
  page: number;
  pageSize: number;
  catalogue: number;
  categorised: boolean;
  facets: { assetClasses: HufFacet[]; categories: HufFacet[]; fundHouses: HufFacet[]; plans: HufFacet[]; options: HufFacet[] };
};

export type HufFundQuery = {
  search?: string;
  assetClass?: string;
  category?: string;
  fundHouse?: string;
  plan?: string;
  option?: string;
  sip?: '1';
  page?: number;
  limit?: number;
};

/** [ISO date, NAV], oldest first. */
export type HufNavPoint = [string, number];

export type HufNavHistory = {
  amfiCode: string | null;
  points: HufNavPoint[];
  returns: {
    periods: { key: string; label: string; percent: number | null; annualised: boolean }[];
    sinceLaunch: { percent: number; annualised: boolean; from: string } | null;
    high52: { nav: number; date: string } | null;
    low52: { nav: number; date: string } | null;
  };
  error: string | null;
};

export type HufInvestments = {
  orders: { orderId: string; date: string | null; time: string | null; schemeCode: string; schemeName: string; type: 'PURCHASE' | 'REDEMPTION'; amount: number | null; units: number | null; folio: string | null; status: string; remark: string; orderType: string; sipRegistrationNo: string | null }[];
  allotments: { orderId: string; date: string | null; schemeCode: string; schemeName: string; folio: string | null; nav: number | null; units: number; amount: number | null }[];
  redemptions: { orderId: string; date: string | null; schemeCode: string; schemeName: string; folio: string | null; units: number; amount: number | null }[];
  sips: { registrationNo: string; status: string; schemeName: string; amount: number | null; frequency: string; startDate: string | null; endDate: string | null; installments: number | null; mandateId: string | null; registeredOn: string | null }[];
  mandates: { mandateId: string; status: string; amount: number | null; bankName: string | null; umrn: string | null; registeredOn: string | null; approvedOn: string | null; endDate: string | null; remark: string | null }[];
  holdings: { schemeCode: string; schemeName: string; folio: string | null; units: number; invested: number; nav: number | null; navDate: string | null; value: number | null }[];
  totals: { invested: number; value: number | null; activeSips: number; sipMonthly: number };
  readFrom: string;
  readAt: string;
};

/** A purchase, mandate or SIP started from the admin, with NSE's link for the karta. */
export type HufRequest = {
  id: string;
  kind: 'PURCHASE' | 'MANDATE' | 'SIP';
  nseId: string | null;
  ok: boolean;
  status: string;
  remark: string | null;
  schemeCode: string | null;
  schemeName: string | null;
  amount: number;
  detail: Record<string, unknown>;
  link: string | null;
  linkError: string | null;
  at: string;
  by: string | null;
};

export type HufInvestmentsView = {
  investments: HufInvestments | null;
  readAt: string | null;
  requests: HufRequest[];
  /** Why the HUF can't invest yet; null when it can. */
  block: string | null;
  live: boolean;
  approvedMandates: { mandateId: string; amount: number | null; endDate: string | null; bankName: string | null }[];
  folios: { schemeCode: string; folio: string }[];
};

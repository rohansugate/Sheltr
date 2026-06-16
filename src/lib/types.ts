export type UserRole = "SEEKER" | "LANDLORD" | "ADMIN";

export type AccountStatus = "PENDING_CLAIM" | "ACTIVE" | "INACTIVE";

export type ListingSource = "MANUAL" | "IMPORTED" | "PLATFORM" | "ZILLOW";

export type ListingStatus = "ACTIVE" | "PENDING_REVIEW" | "INACTIVE" | "DRAFT";

export type MatchStatus = "LIKED" | "PASSED" | "MATCHED" | "APPLIED";

export type ShowingStatus = "REQUESTED" | "ACCEPTED" | "DECLINED";

export type ContactMethod = "phone" | "email";

export type ApplicationStatus =
  | "SENT"
  | "VIEWED"
  | "ACCEPTED"
  | "DECLINED"
  | "INTERVIEW_SCHEDULED"
  | "LEASE_SIGNED";

export type NotificationChannel = "in_app" | "email" | "sms";

export type Locale = "en" | "es" | "zh" | "tl" | "vi" | "ja" | "hi" | "ar" | "fr";

export interface A11ySettings {
  largeText: boolean;
  highContrast: boolean;
  reduceMotion: boolean;
}

export interface DiscoverFilters {
  maxRent: number;
  groundFloorOnly: boolean;
  neighborhood: string;
}

export type HousingSituation = "SHELTER" | "UNSHELTERED" | "COUCH_SURFING";

export type VoucherStatus = "HAS_VOUCHER" | "NEEDS_ASSISTANCE";

export interface SeekerConstraints {
  housingSituation: HousingSituation;
  voucherStatus: VoucherStatus;
  zipCode: string;
  voucherSize: number;
  maxRent: number;
  accessibilityNeeds: boolean;
  proximityNeeds: string[];
}

export interface ListingAnalytics {
  views: number;
  saves: number;
  applications: number;
}

export interface Listing {
  id: string;
  landlordId?: string;
  title: string;
  monthlyRent: number;
  bedrooms: number;
  bathrooms: number;
  images: string[];
  isSection8Approved: boolean;
  isGroundFloor: boolean;
  zipCode: string;
  neighborhood?: string;
  transitLines: string[];
  landlordVerified: boolean;
  latitude: number;
  longitude: number;
  source: ListingSource;
  status: ListingStatus;
  analytics: ListingAnalytics;
  updatedAt?: string;
  sourceUrl?: string;
  petsAllowed?: boolean;
  utilitiesIncluded?: string;
  availableDate?: string;
}

export interface ListingInput {
  title: string;
  monthlyRent: number;
  bedrooms: number;
  bathrooms: number;
  zipCode: string;
  neighborhood: string;
  transitLines: string[];
  isGroundFloor: boolean;
  isSection8Approved: boolean;
  images: string[];
}

export interface ApplicationPacket {
  voucherSize: number;
  maxRent: number;
  voucherCaseNumber: string;
  employment: string;
  references: string;
  notes?: string;
}

export interface Application {
  id: string;
  listingId: string;
  showingId: string;
  seekerId: string;
  seekerName: string;
  packet: ApplicationPacket;
  status: ApplicationStatus;
  sentAt: string;
  updatedAt?: string;
}

export interface Showing {
  id: string;
  listingId: string;
  seekerId: string;
  seekerName: string;
  date: string;
  time: string;
  contactMethod: ContactMethod;
  contactValue: string;
  status: ShowingStatus;
  landlordMessage?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  channels: NotificationChannel[];
  read: boolean;
  createdAt: string;
  conversationId?: string;
  /** Tenant who should see this alert (demo sync). */
  seekerId?: string;
  /** Landlord who should see this alert (demo sync). */
  landlordId?: string;
  /** Display name for the person who triggered the notification. */
  fromName?: string;
}

export interface Conversation {
  id: string;
  applicationId?: string;
  showingId?: string;
  listingId: string;
  listingTitle: string;
  seekerId: string;
  seekerName: string;
  landlordId: string;
  landlordName: string;
  createdAt: string;
  seekerLastReadAt?: string;
  landlordLastReadAt?: string;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  senderRole: "SEEKER" | "LANDLORD";
  text: string;
  sentAt: string;
}

export interface DemoSyncPayload {
  listings: Listing[];
  applications: Application[];
  showings: Showing[];
  conversations: Conversation[];
  messages: ChatMessage[];
  notifications: Notification[];
  updatedAt: string;
}

export interface SwipeAction {
  listing: Listing;
  direction: "left" | "right";
  matchId: string;
}

export interface User {
  id: string;
  role: UserRole;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  constraints?: SeekerConstraints;
  accountStatus: AccountStatus;
}

export interface Match {
  id: string;
  seekerId: string;
  listingId: string;
  status: MatchStatus;
  actorId: string;
  createdAt: string;
}

/** Per-tenant swipe/onboarding state (keyed by user id in the store). */
export interface TenantSession {
  onboardingComplete: boolean;
  constraints: SeekerConstraints | null;
  likedListingIds: string[];
  matches: Match[];
  swipeHistory: SwipeAction[];
  tutorialSeen: boolean;
  discoverFilters: DiscoverFilters;
}

/** Per-landlord seen application/showing ids (keyed by user id in the store). */
export interface LandlordSession {
  seenApplicationIds: string[];
  seenShowingIds: string[];
}

import data from './data/mockData.json'

export type ItemType = 'lost' | 'found'
export type ItemStatus = 'open' | 'in_review' | 'secured' | 'escalated' | 'closed'

export type Item = {
  id: string
  type: ItemType
  category: string
  title: string
  description: string
  location: string
  date: string
  status: ItemStatus
  matchScore: number
}

export type CategoryStyle = { emoji: string; pill: string }

const raw = data as unknown as {
  categories?: Record<string, CategoryStyle>
  items?: Item[]
}

export const ITEMS: Item[] = []
export const CATEGORIES: Record<string, CategoryStyle> = raw.categories ?? {}
export const CATEGORY_NAMES = [
  'Electronics',
  'Phone',
  'Keys',
  'Wallet',
  'Bags',
  'Clothing',
  'Books',
  'Jewellery',
  'Government ID',
  'Medicine',
  'Other',
]

const FALLBACK: CategoryStyle = { emoji: '🎁', pill: '' }
export const categoryStyle = (name: string): CategoryStyle => CATEGORIES[name] ?? FALLBACK

export const emojiFor = (name: string) => categoryStyle(name).emoji

/* ── Roles ─────────────────────────────────────────────────────────────────── */

export type Role = 'student' | 'staff' | 'admin'
export const ROLE_LABELS: Record<Role, string> = {
  student: 'Student',
  staff: 'Helping Staff',
  admin: 'Admin',
}

/* ── Status → Astra badge tone ─────────────────────────────────────────────── */

export const STATUS_LABELS: Record<ItemStatus, string> = {
  open: 'Open',
  in_review: 'In review',
  secured: 'Secured',
  escalated: 'Escalated',
  closed: 'Closed',
}

export type BadgeTone = 'neutral' | 'brand' | 'success' | 'warning' | 'danger'
export const STATUS_TONE: Record<ItemStatus, BadgeTone> = {
  open: 'neutral',
  in_review: 'brand',
  secured: 'success',
  escalated: 'danger',
  closed: 'neutral',
}

/* ── Claim workflow (Feature 8) ────────────────────────────────────────────── */

export type ClaimStage = 'submitted' | 'review' | 'approved'
export const CLAIM_STAGES: { id: ClaimStage; label: string }[] = [
  { id: 'submitted', label: 'Submitted' },
  { id: 'review', label: 'Review' },
  { id: 'approved', label: 'Approved' },
]

export type Claim = { itemId: string; stage: ClaimStage }

// Sensitive categories that must be handed to security (Feature 21).
export const SENSITIVE_CATEGORIES = ['Government ID', 'Medicine', 'ID Card']

// Categories whose descriptions carry owner-only detail worth blurring (Feature 3).
export const isSensitive = (category: string) => SENSITIVE_CATEGORIES.includes(category)

// Campus ID cards get the automatic private-match treatment (Feature 22).
export const ID_CATEGORIES = ['ID Card', 'Government ID']
export const isCampusId = (category: string) => ID_CATEGORIES.includes(category)

/* ── Movement timeline (Features 19 & 28) ──────────────────────────────────────
 * A short "last seen" trail rendered on each card. Derived deterministically
 * from the item id so the same item always shows the same journey. */
export type TimelineEvent = { time: string; place: string }
const PLACES = [
  'Entered main gate',
  'Seen in classroom C-204',
  'Visited the library',
  'Near the canteen counter',
  'Sports complex lobby',
  'Handed to help desk',
]
export function timelineFor(item: Item): TimelineEvent[] {
  const itemId = String(item?.id || 'LF-0000')
  const seed = itemId.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
  const times = ['9:00 AM', '10:30 AM', '12:15 PM']
  return times.map((time, i) => ({ time, place: PLACES[(seed + i) % PLACES.length] }))
}

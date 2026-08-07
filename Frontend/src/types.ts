export type ItemType = 'lost' | 'found'
export type ItemStatus = 'open' | 'in_review' | 'secured' | 'escalated' | 'claimed' | 'closed'

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
  photos?: string[]
}

export type ReportSuggestion = {
  category: string
  title: string
  description: string
  brand?: string
  color?: string
}

export type CategoryStyle = { emoji: string; pill: string }

export type Notification = { title: string; body: string }

export const CATEGORIES: Record<string, CategoryStyle> = {
  Electronics: { emoji: '💻', pill: '' },
  Phone: { emoji: '📱', pill: '' },
  Keys: { emoji: '🔑', pill: '' },
  Wallet: { emoji: '👛', pill: '' },
  Bags: { emoji: '🎒', pill: '' },
  Clothing: { emoji: '🧥', pill: '' },
  Books: { emoji: '📚', pill: '' },
  Jewellery: { emoji: '💍', pill: '' },
  'Government ID': { emoji: '🪪', pill: '' },
  'ID Card': { emoji: '🪪', pill: '' },
  Medicine: { emoji: '💊', pill: '' },
  Other: { emoji: '🎁', pill: '' },
}
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

export type Role = 'student' | 'staff' | 'admin'
export const ROLE_LABELS: Record<Role, string> = {
  student: 'Student',
  staff: 'Helping Staff',
  admin: 'Admin',
}

export const STATUS_LABELS: Record<ItemStatus, string> = {
  open: 'Open',
  in_review: 'In review',
  secured: 'Secured',
  escalated: 'Escalated',
  claimed: 'Claimed',
  closed: 'Closed',
}

export type BadgeTone = 'neutral' | 'brand' | 'success' | 'warning' | 'danger'
export const STATUS_TONE: Record<ItemStatus, BadgeTone> = {
  open: 'neutral',
  in_review: 'brand',
  secured: 'success',
  escalated: 'danger',
  claimed: 'success',
  closed: 'neutral',
}

export type ClaimStatus = 'pending' | 'approved' | 'rejected'
export type ClaimStage = ClaimStatus
export const CLAIM_STAGES: { id: ClaimStage; label: string }[] = [
  { id: 'pending', label: 'Pending' },
  { id: 'approved', label: 'Approved' },
  { id: 'rejected', label: 'Rejected' },
]

export type Claim = {
  id: string
  itemId: string
  claimerId?: string
  claimerEmail?: string
  proofDescription?: string
  status: ClaimStatus
  stage: ClaimStage
  claimantRole: Role
  createdAt: string
  adminNotes?: string
}

export type AdminClaim = Claim & { item?: Item }

export const SENSITIVE_CATEGORIES = ['Government ID', 'Medicine', 'ID Card']

export const isSensitive = (category: string) => SENSITIVE_CATEGORIES.includes(category)

export const ID_CATEGORIES = ['ID Card', 'Government ID']
export const isCampusId = (category: string) => ID_CATEGORIES.includes(category)

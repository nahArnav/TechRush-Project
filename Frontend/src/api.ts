import type { Item, Claim, AdminClaim, Role, ItemType, ItemStatus, ReportSuggestion } from './types'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

function getHeaders(extra: Record<string, string> = {}): Record<string, string> {
  const token = localStorage.getItem('auth_token')
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...extra,
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }
  return headers
}

export async function registerUser(email: string, password: string, role: Role = 'student') {
  const res = await fetch(`${API_BASE_URL}/v1/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, role }),
  })
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.detail || 'Registration failed')
  }
  return res.json()
}

export async function loginUser(email: string, password: string) {
  const res = await fetch(`${API_BASE_URL}/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.detail || 'Invalid email or password')
  }
  return res.json()
}

export async function createDemoSession(role: Role) {
  const res = await fetch(`${API_BASE_URL}/v1/auth/demo-session`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ role }),
  })
  if (!res.ok) {
    throw new Error('Failed to create demo session')
  }
  return res.json()
}

function mapItem(i: any): Item {
  return {
    id: String(i.id || 'LF-0000'),
    type: i.type || 'found',
    category: i.category || 'Other',
    title: i.title || 'Reported item',
    description: i.description || '',
    location: i.location || 'Campus Quad',
    date: i.date || new Date().toISOString().split('T')[0],
    status: i.status || 'open',
    matchScore: typeof i.matchScore === 'number' ? i.matchScore : (typeof i.match_score === 'number' ? i.match_score : 0.5),
    photos: Array.isArray(i.photos) ? i.photos : [],
  }
}

export async function fetchItems(params?: {
  q?: string
  type?: ItemType
  status?: ItemStatus
  category?: string
}): Promise<Item[]> {
  const searchParams = new URLSearchParams()
  if (params?.q) searchParams.set('q', params.q)
  if (params?.type) searchParams.set('type', params.type)
  if (params?.status) searchParams.set('status', params.status)
  if (params?.category) searchParams.set('category', params.category)

  const queryStr = searchParams.toString()
  const url = `${API_BASE_URL}/v1/items${queryStr ? `?${queryStr}` : ''}`
  
  const res = await fetch(url, { headers: getHeaders() })
  if (!res.ok) throw new Error('Failed to fetch items')
  const data = await res.json()
  const rawItems = data.items || []

  return rawItems.map(mapItem)
}

export async function createItem(itemData: {
  type: ItemType
  category: string
  title: string
  description: string
  location: string
  date: string
  brand?: string
  color?: string
  anonymous?: boolean
  photos?: string[]
}): Promise<Item> {
  const res = await fetch(`${API_BASE_URL}/v1/items`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(itemData),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.detail || 'Failed to report item')
  }
  return mapItem(await res.json())
}

export async function getItem(id: string): Promise<Item> {
  const res = await fetch(`${API_BASE_URL}/v1/items/${id}`, { headers: getHeaders() })
  if (!res.ok) throw new Error('Item not found')
  return mapItem(await res.json())
}

export async function fetchClaims(): Promise<Claim[]> {
  const res = await fetch(`${API_BASE_URL}/v1/claims`, { headers: getHeaders() })
  if (!res.ok) return []
  const data = await res.json()
  return (data || []).map((c: any) => ({
    id: c.id,
    itemId: c.item_id,
    itemTitle: c.item_title || c.item?.title,
    status: c.status || (c.stage === 'approved' ? 'approved' : c.stage === 'rejected' ? 'rejected' : 'pending'),
    stage: c.status || (c.stage === 'approved' ? 'approved' : c.stage === 'rejected' ? 'rejected' : 'pending'),
    claimerId: c.claimer_id,
    claimerEmail: c.claimer_email,
    proofDescription: c.proof_description,
    claimantRole: c.claimant_role,
    createdAt: c.created_at,
  }))
}

export async function createClaim(itemId: string, proof: string): Promise<Claim> {
  const res = await fetch(`${API_BASE_URL}/v1/claims`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ item_id: itemId, proof_description: proof }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.detail || 'Failed to submit claim')
  }
  const c = await res.json()
  return {
    id: c.id,
    itemId: c.item_id,
    itemTitle: c.item_title || c.item?.title,
    status: c.status || 'pending',
    stage: c.status || 'pending',
    claimerId: c.claimer_id,
    claimerEmail: c.claimer_email,
    proofDescription: c.proof_description,
    claimantRole: c.claimant_role,
    createdAt: c.created_at,
  }
}

export async function updateClaimStage(claimId: string, stage: string): Promise<Claim> {
  const res = await fetch(`${API_BASE_URL}/v1/claims/${claimId}/stage`, {
    method: 'PATCH',
    headers: getHeaders(),
    body: JSON.stringify({ stage }),
  })
  if (!res.ok) throw new Error('Failed to update claim stage')
  const c = await res.json()
  return {
    id: c.id,
    itemId: c.item_id,
    itemTitle: c.item_title || c.item?.title,
    status: c.status || 'pending',
    stage: c.status || 'pending',
    claimantRole: c.claimant_role,
    createdAt: c.created_at,
  }
}

function mapAdminClaim(c: any): AdminClaim {
  return {
    id: c.id,
    itemId: c.item_id,
    itemTitle: c.item_title || c.item?.title,
    status: c.status,
    stage: c.status,
    claimerId: c.claimer_id,
    claimerEmail: c.claimer_email,
    claimantRole: c.claimant_role,
    proofDescription: c.proof_description,
    createdAt: c.created_at,
    adminNotes: c.admin_notes,
    unreadMessageCount: c.unread_message_count || 0,
    item: c.item ? mapItem(c.item) : undefined,
  }
}

export async function fetchAdminClaims(status?: 'pending' | 'approved' | 'rejected'): Promise<AdminClaim[]> {
  const suffix = status ? `?status=${encodeURIComponent(status)}` : ''
  const res = await fetch(`${API_BASE_URL}/api/admin/claims${suffix}`, { headers: getHeaders() })
  if (!res.ok) throw new Error('Failed to load claims for review')
  return (await res.json()).map(mapAdminClaim)
}

export async function reviewAdminClaim(claimId: string, status: 'approved' | 'rejected', adminNotes = ''): Promise<Claim> {
  const res = await fetch(`${API_BASE_URL}/api/admin/claims/${claimId}/review`, {
    method: 'PATCH', headers: getHeaders(), body: JSON.stringify({ status, admin_notes: adminNotes }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.detail || 'Failed to review claim')
  }
  const c = await res.json()
  return { id: c.id, itemId: c.item_id, itemTitle: c.item_title || c.item?.title, status: c.status, stage: c.status, claimantRole: c.claimant_role, createdAt: c.created_at }
}

export async function fetchMapData() {
  const res = await fetch(`${API_BASE_URL}/v1/map`, { headers: getHeaders() })
  if (!res.ok) throw new Error('Failed to fetch map data')
  return res.json()
}

export async function fetchUserActivity(): Promise<any[]> {
  const res = await fetch(`${API_BASE_URL}/v1/activity`, { headers: getHeaders() })
  if (!res.ok) return []
  return res.json()
}

export async function suggestReportDetails(payload: {
  source: 'photo' | 'camera' | 'microphone' | 'text'
  notes?: string
  location?: string
  photos?: string[]
}): Promise<ReportSuggestion> {
  const res = await fetch(`${API_BASE_URL}/v1/ai/report-details`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error('Failed to analyze report details')
  return res.json()
}

export type ChatMessage = {
  id: string
  itemId: string
  claimId?: string
  sender: 'me' | 'them' | 'staff' | 'system'
  text: string
  createdAt: string
  readByAdmin?: boolean
}

const mapMessage = (m: any): ChatMessage => ({
  id: String(m.id),
  itemId: String(m.item_id),
  claimId: m.claim_id,
  sender: m.sender || 'me',
  text: m.text || '',
  createdAt: m.created_at || new Date().toISOString(),
  readByAdmin: Boolean(m.read_by_admin),
})

export async function fetchClaimMessages(claimId: string, admin = false): Promise<ChatMessage[]> {
  const prefix = admin ? '/api/admin/claims' : '/api/claims'
  const res = await fetch(`${API_BASE_URL}${prefix}/${claimId}/messages`, { headers: getHeaders() })
  if (!res.ok) throw new Error('Failed to load claim conversation')
  return (await res.json()).map(mapMessage)
}

export async function sendClaimMessage(claimId: string, text: string, admin = false): Promise<ChatMessage> {
  const prefix = admin ? '/api/admin/claims' : '/api/claims'
  const res = await fetch(`${API_BASE_URL}${prefix}/${claimId}/messages`, {
    method: 'POST', headers: getHeaders(), body: JSON.stringify({ message: text }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.detail || 'Failed to send message')
  }
  return mapMessage(await res.json())
}

export async function fetchMessages(itemId: string): Promise<ChatMessage[]> {
  const res = await fetch(`${API_BASE_URL}/v1/messages/${itemId}`, { headers: getHeaders() })
  if (!res.ok) return []
  const data = await res.json()
  return Array.isArray(data) ? data.map(mapMessage) : []
}

export async function sendMessage(itemId: string, text: string): Promise<ChatMessage> {
  const res = await fetch(`${API_BASE_URL}/v1/messages/${itemId}`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ text, sender: 'me' }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.detail || 'Failed to send message')
  }
  return mapMessage(await res.json())
}

import type { Item, Claim, Role, ItemType, ItemStatus, ReportSuggestion } from './types'

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

async function getErrorMessage(res: Response, fallback: string): Promise<string> {
  const err = await res.json().catch(() => ({}))
  if (typeof err.detail === 'string') return err.detail
  if (typeof err.message === 'string') return err.message
  if (Array.isArray(err.detail)) return err.detail.map((issue: any) => issue.msg || JSON.stringify(issue)).join('; ')
  return fallback
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

  return rawItems.map((i: any) => ({
    id: String(i.id || 'LF-0000'),
    type: i.type || 'found',
    category: i.category || 'Other',
    title: i.title || 'Reported item',
    description: i.description || '',
    location: i.location || 'Campus Quad',
    date: i.date || new Date().toISOString().split('T')[0],
    status: i.status || 'open',
    matchScore: typeof i.matchScore === 'number' ? i.matchScore : (typeof i.match_score === 'number' ? i.match_score : 0.5),
    userId: i.user_id ?? i.userId,
    sightingCount: typeof i.sightingCount === 'number' ? i.sightingCount : (typeof i.sighting_count === 'number' ? i.sighting_count : 0),
    sightedByUserIds: Array.isArray(i.sighted_by_user_ids) ? i.sighted_by_user_ids : (Array.isArray(i.sightedByUserIds) ? i.sightedByUserIds : []),
  }))
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
}): Promise<Item> {
  const res = await fetch(`${API_BASE_URL}/v1/items`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({
      ...itemData,
      reporter_id: localStorage.getItem('user_id') || 'guest',
      reporter_email: localStorage.getItem('user_email') || 'guest@pict.edu',
    }),
  })
  if (!res.ok) {
    throw new Error(await getErrorMessage(res, 'Failed to report item'))
  }
  const i = await res.json()
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
    userId: i.user_id ?? i.userId,
    sightingCount: typeof i.sightingCount === 'number' ? i.sightingCount : (typeof i.sighting_count === 'number' ? i.sighting_count : 0),
    sightedByUserIds: Array.isArray(i.sighted_by_user_ids) ? i.sighted_by_user_ids : (Array.isArray(i.sightedByUserIds) ? i.sightedByUserIds : []),
  }
}

export async function getItem(id: string): Promise<Item> {
  const res = await fetch(`${API_BASE_URL}/v1/items/${id}`, { headers: getHeaders() })
  if (!res.ok) throw new Error('Item not found')
  const i = await res.json()
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
    userId: i.user_id ?? i.userId,
    sightingCount: typeof i.sightingCount === 'number' ? i.sightingCount : (typeof i.sighting_count === 'number' ? i.sighting_count : 0),
    sightedByUserIds: Array.isArray(i.sighted_by_user_ids) ? i.sighted_by_user_ids : (Array.isArray(i.sightedByUserIds) ? i.sightedByUserIds : []),
  }
}

export async function toggleSawThis(itemId: string): Promise<{
  itemId: string
  sightingCount: number
  sighted: boolean
  sightedByUserIds: string[]
}> {
  const res = await fetch(`${API_BASE_URL}/v1/items/${itemId}/saw-this`, {
    method: 'POST',
    headers: getHeaders(),
  })
  if (!res.ok) {
    throw new Error(await getErrorMessage(res, 'Failed to update sighting count'))
  }
  const data = await res.json()
  return {
    itemId: data.item_id || itemId,
    sightingCount: typeof data.sighting_count === 'number' ? data.sighting_count : 0,
    sighted: Boolean(data.sighted),
    sightedByUserIds: Array.isArray(data.sighted_by_user_ids) ? data.sighted_by_user_ids : [],
  }
}

export async function fetchClaims(): Promise<Claim[]> {
  const res = await fetch(`${API_BASE_URL}/v1/claims`, { headers: getHeaders() })
  if (!res.ok) return []
  const data = await res.json()
  return (data || []).map((c: any) => ({
    id: c.id,
    itemId: c.item_id,
    stage: c.stage,
    claimantRole: c.claimant_role,
    createdAt: c.created_at,
  }))
}

export async function createClaim(itemId: string, proof: string): Promise<Claim> {
  const res = await fetch(`${API_BASE_URL}/v1/claims`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ item_id: itemId, proof }),
  })
  if (!res.ok) {
    throw new Error(await getErrorMessage(res, 'Failed to submit claim'))
  }
  const c = await res.json()
  return {
    id: c.id,
    itemId: c.item_id,
    stage: c.stage,
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
    stage: c.stage,
    claimantRole: c.claimant_role,
    createdAt: c.created_at,
  }
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
}): Promise<ReportSuggestion> {
  const res = await fetch(`${API_BASE_URL}/v1/ai/report-details`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error('Failed to analyze report details')
  return res.json()
}

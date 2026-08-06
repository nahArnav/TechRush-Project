/**
 * Lightweight fire-and-forget activity tracker.
 * Sends user interactions to POST /v1/activity so they are
 * persisted in the `activity_log` MongoDB collection.
 */

const API = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

export type ActivityAction =
  | 'page_view'
  | 'login'
  | 'register'
  | 'logout'
  | 'search'
  | 'i_saw_this'
  | 'claim_opened'
  | 'claim_submitted'
  | 'report_opened'
  | 'report_submitted'
  | 'chat_opened'
  | 'chat_message_sent'
  | 'handover_proposed'
  | 'handover_code_generated'
  | 'handover_code_verified'
  | 'handover_confirmed'
  | 'map_opened'
  | 'map_building_selected'
  | 'map_report_here'
  | 'cctv_request'
  | 'save_search'
  | 'role_switched'
  | 'theme_toggled'
  | 'support_opened'
  | 'item_viewed'
  | 'photo_analyzed'
  | 'photo_attached'
  | 'camera_report_drafted'
  | 'microphone_report_drafted'

export function trackActivity(
  action: ActivityAction,
  itemId?: string,
  metadata?: Record<string, unknown>,
) {
  const token = localStorage.getItem('auth_token')
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const body: Record<string, unknown> = { action }
  if (itemId) body.item_id = itemId
  if (metadata) body.metadata = metadata

  // Fire-and-forget — never block the UI
  fetch(`${API}/v1/activity`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  }).catch(() => {
    /* swallow silently — activity logging is best-effort */
  })
}

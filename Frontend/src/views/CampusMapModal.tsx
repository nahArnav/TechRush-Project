import { useEffect, useState } from 'react'
import { Compass, Box } from 'lucide-react'
import { NeoModal } from '../neo'
import type { ReportPrefill } from './ReportItemModal'
import type { Item } from '../types'
import CampusMap3D, { CATEGORY_PIN_COLORS } from './CampusMap3D'
import { fetchItems } from '../api'

export default function CampusMapModal({
  isOpen,
  onClose,
  onReportHere,
  onSelectItem,
}: {
  isOpen: boolean
  onClose: () => void
  onReportHere?: (prefill: ReportPrefill) => void
  onSelectItem?: (item: Item) => void
}) {
  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!isOpen) return
    async function loadMapItems() {
      setLoading(true)
      try {
        const liveItems = await fetchItems()
        setItems(liveItems || [])
      } catch (e) {
        console.error('Failed to load live map items:', e)
      } finally {
        setLoading(false)
      }
    }
    loadMapItems()
  }, [isOpen])

  return (
    <NeoModal
      isOpen={isOpen}
      onClose={onClose}
      size="full"
      icon={<Compass size={18} />}
      title="Campus map"
      subtitle="Drag to rotate, scroll to zoom, click a building or right-click anywhere to add a report pin"
    >
      <div className="relative flex min-h-[640px] w-full flex-col gap-lg">
        <div className="flex flex-wrap items-center justify-between gap-md rounded-neo bg-plate p-md shadow-carve-sm">
          <div className="flex items-center gap-md text-xs font-bold text-ink">
            <span className="flex items-center gap-xs rounded-neo-full bg-ink px-md py-xs text-[10px] font-black uppercase text-on-ink">
              <Box size={12} /> 3D WebGL Engine
            </span>
            <span>Closed claims disappear from the map automatically</span>
          </div>

          <div className="flex items-center gap-sm text-xs text-ink-muted">
            {Object.entries(CATEGORY_PIN_COLORS).slice(0, 4).map(([category, color]) => (
              <span key={category} className="flex items-center gap-xs">
                <span className="size-2 rounded-neo-full" style={{ backgroundColor: color.css }} /> {category}
              </span>
            ))}
          </div>
        </div>

        <div className="h-[640px] w-full overflow-hidden rounded-neo-lg border border-line shadow-float">
          <CampusMap3D
            items={items}
            onReportHere={(prefill) => {
              onReportHere?.(prefill)
              onClose()
            }}
            onSelectItem={(item) => {
              onSelectItem?.(item)
              onClose()
            }}
          />
        </div>
      </div>
    </NeoModal>
  )
}

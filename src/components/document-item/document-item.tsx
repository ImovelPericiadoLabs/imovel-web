'use client'
import { useMemo } from 'react'
import { Trash, Image as ImageIcon, File } from 'lucide-react'

interface Document {
  id: string
  name: string
  size: number
  type: string
}

interface DocumentItemProps {
  document: Document
  onRemove: () => void
}

export default function DocumentItem({ document, onRemove }: DocumentItemProps) {
  const icon = useMemo(() => {
    const className = 'size-6 text-primary'

    if (document.type?.includes('image')) {
      return <ImageIcon className={className} />
    }

    return <File className={className} />
  }, [document])

  return (
    <div className="border-2 border-primary rounded-xl p-4 flex items-center justify-between bg-white">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {icon}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium overflow-hidden text-ellipsis whitespace-nowrap direction-rtl">
            {document.name}
          </p>
          <p className="text-xs text-gray-500">{document.size} MB</p>
        </div>
      </div>
      <button
        onClick={onRemove}
        className="cursor-pointer shrink-0 ml-2 p-2"
        aria-label="Deletar documento"
      >
        <Trash className="size-5" />
      </button>
    </div>
  )
}

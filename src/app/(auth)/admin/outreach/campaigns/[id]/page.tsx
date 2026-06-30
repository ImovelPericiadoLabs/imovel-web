'use client'

import { useParams } from 'next/navigation'
import CampaignFullEditor from '../../_components/CampaignFullEditor'

export default function OutreachCampaignEditorPage() {
  const params = useParams()
  const id = typeof params.id === 'string' ? params.id : Array.isArray(params.id) ? params.id[0] : ''
  if (!id) {
    return null
  }
  return <CampaignFullEditor campaignId={id} />
}

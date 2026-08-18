import { redirect } from 'next/navigation'

/** Inbox de campanhas unificado em /admin/inbox. */
export default function AdminChatRedirectPage() {
  redirect('/admin/inbox?source=campaign')
}

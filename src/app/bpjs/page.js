import { redirect } from 'next/navigation'

export default function BpjsRedirect() {
  redirect('/monitoring/business?tab=bpjs')
}

import { redirect } from 'next/navigation'

export default function BPJSMonitoringRedirect() {
  redirect('/monitoring/business?tab=bpjs')
}

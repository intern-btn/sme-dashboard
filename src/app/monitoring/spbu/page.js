import { redirect } from 'next/navigation'

export default function SPBUMonitoringRedirect() {
  redirect('/monitoring/business?tab=spbu')
}

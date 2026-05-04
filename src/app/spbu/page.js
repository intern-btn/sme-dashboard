import { redirect } from 'next/navigation'

export default function SpbuRedirect() {
  redirect('/monitoring/business?tab=spbu')
}

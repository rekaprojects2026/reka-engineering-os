import { redirect } from 'next/navigation'

// /intakes now lives at /leads — redirect for backward compatibility
export default function IntakesRedirect() {
  redirect('/leads')
}

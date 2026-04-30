import { redirect } from 'next/navigation'

// /leads/new → /intakes/new (same form, both create intakes)
export default function LeadsNewRedirect() {
  redirect('/intakes/new')
}

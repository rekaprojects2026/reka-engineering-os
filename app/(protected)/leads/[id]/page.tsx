import { redirect } from 'next/navigation'

// /leads/[id] → /intakes/[id] (same entity, just renamed)
export default async function LeadsDetailRedirect({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  redirect(`/intakes/${id}`)
}

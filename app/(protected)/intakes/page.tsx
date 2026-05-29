import { permanentRedirect } from 'next/navigation'

// /intakes now lives at /leads — permanent redirect for backward compatibility
export default function IntakesRedirect() {
  permanentRedirect('/leads')
}

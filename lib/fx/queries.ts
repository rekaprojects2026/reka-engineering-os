import type { SupabaseClient } from '@supabase/supabase-js'
import { createServerClient } from '@/lib/supabase/server'
import type { FxRate } from '@/types/database'

/** Latest FX rate using an existing Supabase client (safe inside `unstable_cache`). */
export async function getLatestFxRateWithClient(
  supabase: SupabaseClient,
  fromCurrency: string,
  toCurrency: string,
): Promise<number | null> {
  const { data } = await supabase
    .from('fx_rates')
    .select('rate')
    .eq('from_currency', fromCurrency)
    .eq('to_currency', toCurrency)
    .order('effective_date', { ascending: false })
    .limit(1)
    .single()

  return data?.rate ?? null
}

/** Get the latest FX rate for a currency pair */
export async function getLatestFxRate(
  fromCurrency: string,
  toCurrency: string
): Promise<number | null> {
  const supabase = await createServerClient()
  return getLatestFxRateWithClient(supabase, fromCurrency, toCurrency)
}

/** Get all FX rates (for settings management) */
export async function getFxRates(): Promise<FxRate[]> {
  const supabase = await createServerClient()
  const { data } = await supabase
    .from('fx_rates')
    .select('*')
    .order('effective_date', { ascending: false })
    .limit(50)

  return data ?? []
}

/** Get current USD→IDR rate, fallback to 16400 */
export async function getUsdToIdrWithClient(supabase: SupabaseClient): Promise<number> {
  const rate = await getLatestFxRateWithClient(supabase, 'USD', 'IDR')
  return rate ?? 16400
}

/** Get current USD→IDR rate, fallback to 16400 */
export async function getUsdToIdrRate(): Promise<number> {
  const supabase = await createServerClient()
  return getUsdToIdrWithClient(supabase)
}

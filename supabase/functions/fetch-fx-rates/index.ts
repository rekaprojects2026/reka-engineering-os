/**
 * Supabase Edge Function — daily FX fetch (USD→IDR, EUR→IDR) via exchangerate.host
 *
 * Deploy: supabase functions deploy fetch-fx-rates
 * Invoke with service role Authorization header.
 *
 * Schedule: pg_cron + pg_net (see Fase 7 briefing) or Supabase Dashboard cron.
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4'

Deno.serve(async () => {
  const url = Deno.env.get('SUPABASE_URL')
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!url || !key) {
    return new Response('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY', { status: 500 })
  }

  const res = await fetch('https://api.exchangerate.host/latest?base=IDR&symbols=USD,EUR')
  const json = (await res.json()) as { rates?: { USD?: number; EUR?: number } }
  if (!json?.rates?.USD || !json?.rates?.EUR) {
    return new Response(JSON.stringify({ error: 'No rates from API', body: json }), {
      status: 502,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const usdPerIdr = json.rates.USD
  const eurPerIdr = json.rates.EUR
  const usdToIdr = Math.round(1 / usdPerIdr)
  const eurToIdr = Math.round(1 / eurPerIdr)
  const today = new Date().toISOString().slice(0, 10)
  const note = 'auto:exchangerate.host'

  const supabase = createClient(url, key)
  const payload = [
    {
      from_currency: 'USD',
      to_currency: 'IDR',
      rate: usdToIdr,
      effective_date: today,
      notes: note,
    },
    {
      from_currency: 'EUR',
      to_currency: 'IDR',
      rate: eurToIdr,
      effective_date: today,
      notes: note,
    },
  ]

  const { error } = await supabase.from('fx_rates').upsert(payload, {
    onConflict: 'from_currency,to_currency,effective_date',
  })

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  return new Response(JSON.stringify({ ok: true, rates: payload }), {
    headers: { 'Content-Type': 'application/json' },
  })
})

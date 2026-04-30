import { Document, Page, Text, View } from '@react-pdf/renderer'
import type { PayslipWithProfile } from '@/lib/payslips/queries'
import type { Currency } from '@/types/database'
import { COMPANY } from '@/lib/pdf/shared/company'
import { formatMoney, periodLabelId } from '@/lib/pdf/shared/format'
import { pdfStyles } from '@/lib/pdf/shared/styles'

function roleLine(functional: string | null | undefined, system: string | null | undefined): string {
  if (functional?.trim()) return functional.trim()
  if (system) return system.charAt(0).toUpperCase() + system.slice(1)
  return '—'
}

export function PayslipPDF({ payslip }: { payslip: PayslipWithProfile }) {
  const currency = (payslip.currency || 'IDR') as Currency
  const period = periodLabelId(payslip.period_month, payslip.period_year)
  const name = payslip.profile?.full_name ?? '—'
  const code = payslip.payslip_code || payslip.id

  return (
    <Document title={`Payslip ${code}`}>
      <Page size="A4" style={pdfStyles.page}>
        <View style={pdfStyles.header}>
          <View style={pdfStyles.row}>
            <View style={pdfStyles.col}>
              <Text style={pdfStyles.h1}>{COMPANY.name}</Text>
              <Text style={pdfStyles.small}>{COMPANY.address}</Text>
            </View>
            <View style={[pdfStyles.col, { alignItems: 'flex-end' }]}>
              <Text style={pdfStyles.h1}>SLIP GAJI</Text>
              <Text style={pdfStyles.small}>{code}</Text>
              <Text style={pdfStyles.small}>{period}</Text>
            </View>
          </View>
        </View>

        <View style={{ marginBottom: 16, padding: 10, borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 4 }}>
          <Text style={pdfStyles.h2}>Penerima</Text>
          <Text style={{ fontSize: 14, fontWeight: 700, marginTop: 4 }}>{name}</Text>
          <Text style={pdfStyles.small}>{roleLine(payslip.profile?.functional_role, payslip.profile?.system_role)}</Text>
          {payslip.profile?.bank_name ? (
            <Text style={[pdfStyles.small, { marginTop: 6 }]}>
              Bank: {payslip.profile.bank_name}
              {payslip.profile.bank_account_number ? ` · ${payslip.profile.bank_account_number}` : ''}
            </Text>
          ) : null}
        </View>

        <View style={pdfStyles.table}>
          <View style={pdfStyles.th}>
            <View style={{ flex: 2 }}>
              <Text style={pdfStyles.thText}>Komponen</Text>
            </View>
            <View style={{ flex: 1, alignItems: 'flex-end' }}>
              <Text style={pdfStyles.thText}>Jumlah</Text>
            </View>
          </View>
          <View style={pdfStyles.td}>
            <View style={{ flex: 2 }}>
              <Text>Gaji pokok</Text>
            </View>
            <View style={{ flex: 1, alignItems: 'flex-end' }}>
              <Text>{formatMoney(payslip.base_amount ?? 0, currency)}</Text>
            </View>
          </View>
          <View style={pdfStyles.td}>
            <View style={{ flex: 2 }}>
              <Text>Bonus</Text>
            </View>
            <View style={{ flex: 1, alignItems: 'flex-end' }}>
              <Text>{formatMoney(payslip.bonus_amount ?? 0, currency)}</Text>
            </View>
          </View>
          <View style={pdfStyles.td}>
            <View style={{ flex: 2 }}>
              <Text>Potongan</Text>
            </View>
            <View style={{ flex: 1, alignItems: 'flex-end' }}>
              <Text>{formatMoney(payslip.deduction_amount ?? 0, currency)}</Text>
            </View>
          </View>
          <View style={[pdfStyles.td, pdfStyles.grandTotal]}>
            <View style={{ flex: 2 }}>
              <Text>Net dibayar</Text>
            </View>
            <View style={{ flex: 1, alignItems: 'flex-end' }}>
              <Text>{formatMoney(payslip.net_amount ?? 0, currency)}</Text>
            </View>
          </View>
        </View>

        <View style={{ marginTop: 20 }}>
          <Text style={pdfStyles.h2}>Pembayaran</Text>
          <Text style={pdfStyles.small}>Dibayar ke: {payslip.payment_accounts?.name ?? '—'}</Text>
          <Text style={[pdfStyles.small, { marginTop: 4 }]}>
            Status: {payslip.status === 'paid' ? 'Lunas' : payslip.status === 'sent' ? 'Terkirim' : 'Draft'}
          </Text>
        </View>

        {payslip.notes ? (
          <View style={{ marginTop: 14 }}>
            <Text style={pdfStyles.h2}>Catatan</Text>
            <Text style={pdfStyles.small}>{payslip.notes}</Text>
          </View>
        ) : null}

        <View style={{ marginTop: 24, padding: 10, backgroundColor: '#f9fafb', borderRadius: 4 }}>
          <Text style={{ fontSize: 9, color: '#4b5563' }}>
            Slip ini merupakan bukti pembayaran yang dihasilkan sistem; mohon dicocokkan dengan rekening Anda.
          </Text>
        </View>

        <Text style={pdfStyles.footer} fixed>
          {COMPANY.name} · {COMPANY.website} · Slip gaji ini dibuat otomatis oleh Reka Engineering OS.
        </Text>
      </Page>
    </Document>
  )
}

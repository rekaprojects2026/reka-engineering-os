import { Document, Page, Text, View } from '@react-pdf/renderer'
import type { InvoiceWithRelations } from '@/lib/invoices/queries'
import { COMPANY } from '@/lib/pdf/shared/company'
import { formatDateID, formatMoney } from '@/lib/pdf/shared/format'
import { pdfColors, pdfStyles } from '@/lib/pdf/shared/styles'

function lineItemsSubtotal(invoice: InvoiceWithRelations): number {
  const items = invoice.line_items ?? []
  return items.reduce((sum, row) => sum + (row.subtotal ?? 0), 0)
}

export function InvoicePDF({ invoice }: { invoice: InvoiceWithRelations }) {
  const items = invoice.line_items ?? []
  const lineSum = lineItemsSubtotal(invoice)
  const code = invoice.invoice_code || invoice.id

  return (
    <Document title={`Invoice ${code}`}>
      <Page size="A4" style={pdfStyles.page}>
        <View style={pdfStyles.header}>
          <View style={pdfStyles.row}>
            <View style={pdfStyles.col}>
              <Text style={pdfStyles.h1}>{COMPANY.name}</Text>
              <Text style={pdfStyles.small}>{COMPANY.address}</Text>
              <Text style={pdfStyles.small}>{COMPANY.email}</Text>
              <Text style={pdfStyles.small}>NPWP: {COMPANY.npwp}</Text>
            </View>
            <View style={[pdfStyles.col, { alignItems: 'flex-end' }]}>
              <Text style={pdfStyles.h1}>INVOICE</Text>
              <Text style={pdfStyles.small}>#{code}</Text>
            </View>
          </View>
        </View>

        <View style={pdfStyles.row}>
          <View style={{ flex: 1 }}>
            <Text style={pdfStyles.h2}>Ditagihkan kepada</Text>
            <Text>{invoice.clients?.client_name ?? '—'}</Text>
            {invoice.clients?.client_code ? (
              <Text style={pdfStyles.small}>Kode: {invoice.clients.client_code}</Text>
            ) : null}
          </View>
          <View style={{ width: 220 }}>
            <View style={pdfStyles.labelValue}>
              <Text style={pdfStyles.label}>Tanggal</Text>
              <Text style={pdfStyles.value}>{formatDateID(invoice.issue_date)}</Text>
            </View>
            <View style={pdfStyles.labelValue}>
              <Text style={pdfStyles.label}>Jatuh tempo</Text>
              <Text style={pdfStyles.value}>{formatDateID(invoice.due_date)}</Text>
            </View>
            <View style={pdfStyles.labelValue}>
              <Text style={pdfStyles.label}>Proyek</Text>
              <Text style={pdfStyles.value}>
                {invoice.projects?.name ?? invoice.projects?.project_code ?? '—'}
              </Text>
            </View>
            <View style={pdfStyles.labelValue}>
              <Text style={pdfStyles.label}>Mata uang</Text>
              <Text style={pdfStyles.value}>{invoice.currency}</Text>
            </View>
          </View>
        </View>

        {items.length > 0 ? (
          <View style={pdfStyles.table}>
            <View style={pdfStyles.th}>
              <View style={pdfStyles.colDesc}>
                <Text style={pdfStyles.thText}>Deskripsi</Text>
              </View>
              <View style={{ flex: 1, alignItems: 'flex-end' }}>
                <Text style={pdfStyles.thText}>Qty</Text>
              </View>
              <View style={{ flex: 1.5, alignItems: 'flex-end' }}>
                <Text style={pdfStyles.thText}>Harga satuan</Text>
              </View>
              <View style={{ flex: 1.5, alignItems: 'flex-end' }}>
                <Text style={pdfStyles.thText}>Subtotal</Text>
              </View>
            </View>
            {items.map((row) => (
              <View style={pdfStyles.td} key={row.id}>
                <View style={pdfStyles.colDesc}>
                  <Text>{row.description}</Text>
                </View>
                <View style={{ flex: 1, alignItems: 'flex-end' }}>
                  <Text>{String(row.qty)}</Text>
                </View>
                <View style={{ flex: 1.5, alignItems: 'flex-end' }}>
                  <Text>{formatMoney(row.unit_price ?? 0, invoice.currency)}</Text>
                </View>
                <View style={{ flex: 1.5, alignItems: 'flex-end' }}>
                  <Text>{formatMoney(row.subtotal ?? 0, invoice.currency)}</Text>
                </View>
              </View>
            ))}
          </View>
        ) : (
          <View style={{ marginTop: 12 }}>
            <Text style={pdfStyles.small}>Tidak ada rincian baris; total mengikuti ringkasan bruto di bawah.</Text>
          </View>
        )}

        <View style={pdfStyles.totalsBox}>
          {items.length > 0 ? (
            <View style={pdfStyles.totalRow}>
              <Text style={pdfStyles.small}>Subtotal baris</Text>
              <Text style={pdfStyles.small}>{formatMoney(lineSum, invoice.currency)}</Text>
            </View>
          ) : null}
          <View style={pdfStyles.totalRow}>
            <Text>Bruto</Text>
            <Text>{formatMoney(invoice.gross_amount ?? 0, invoice.currency)}</Text>
          </View>
          {(invoice.platform_fee_pct ?? 0) > 0 && (invoice.platform_fee_amount ?? 0) > 0 ? (
            <View style={pdfStyles.totalRow}>
              <Text style={pdfStyles.small}>
                Biaya platform{invoice.platform_type ? ` (${invoice.platform_type})` : ''}{' '}
                {invoice.platform_fee_pct}%
              </Text>
              <Text style={pdfStyles.small}>
                −{formatMoney(invoice.platform_fee_amount ?? 0, invoice.currency)}
              </Text>
            </View>
          ) : null}
          {(invoice.gateway_fee_pct ?? 0) > 0 && (invoice.gateway_fee_amount ?? 0) > 0 ? (
            <View style={pdfStyles.totalRow}>
              <Text style={pdfStyles.small}>Biaya gateway {invoice.gateway_fee_pct}%</Text>
              <Text style={pdfStyles.small}>
                −{formatMoney(invoice.gateway_fee_amount ?? 0, invoice.currency)}
              </Text>
            </View>
          ) : null}
          <View style={[pdfStyles.totalRow, pdfStyles.grandTotal]}>
            <Text>Net diterima</Text>
            <Text>{formatMoney(invoice.net_amount ?? 0, invoice.currency)}</Text>
          </View>
        </View>

        <View style={{ marginTop: 28 }}>
          <Text style={pdfStyles.h2}>Pembayaran</Text>
          <Text>{COMPANY.bankName}</Text>
          <Text>{COMPANY.bankAcc}</Text>
          {invoice.payment_accounts?.name ? (
            <Text style={[pdfStyles.small, { marginTop: 4 }]}>
              Rekening tujuan (invoice): {invoice.payment_accounts.name}
            </Text>
          ) : null}
        </View>

        {invoice.notes ? (
          <View style={{ marginTop: 16 }}>
            <Text style={pdfStyles.h2}>Catatan</Text>
            <Text style={pdfStyles.small}>{invoice.notes}</Text>
          </View>
        ) : null}

        <Text style={pdfStyles.footer} fixed>
          {COMPANY.name} · {COMPANY.website} · Invoice ini dibuat otomatis oleh Reka Engineering OS.
        </Text>
      </Page>
    </Document>
  )
}

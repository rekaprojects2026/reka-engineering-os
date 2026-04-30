import { StyleSheet } from '@react-pdf/renderer'

export const pdfColors = {
  text: '#111111',
  muted: '#6b7280',
  border: '#e5e7eb',
  accent: '#2563eb',
  tableHead: '#f3f4f6',
} as const

export const pdfStyles = StyleSheet.create({
  page: {
    paddingTop: 48,
    paddingBottom: 48,
    paddingLeft: 48,
    paddingRight: 48,
    fontSize: 10,
    fontFamily: 'Helvetica',
    color: pdfColors.text,
  },
  header: {
    marginBottom: 24,
    borderBottom: `1pt solid ${pdfColors.border}`,
    paddingBottom: 12,
  },
  h1: { fontSize: 18, fontWeight: 700, marginBottom: 4 },
  h2: { fontSize: 12, fontWeight: 700, marginTop: 12, marginBottom: 6 },
  small: { fontSize: 9, color: pdfColors.muted },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  col: { flexDirection: 'column' },
  labelValue: { flexDirection: 'row', marginBottom: 2 },
  label: { width: 90, color: pdfColors.muted, fontSize: 9 },
  value: { flex: 1, fontSize: 10 },
  table: { marginTop: 12, borderTop: `1pt solid ${pdfColors.border}` },
  th: {
    flexDirection: 'row',
    backgroundColor: pdfColors.tableHead,
    padding: 6,
    borderBottom: `0.5pt solid ${pdfColors.border}`,
  },
  td: {
    flexDirection: 'row',
    padding: 6,
    borderBottom: `0.5pt solid ${pdfColors.border}`,
  },
  thText: { fontSize: 9, fontWeight: 700 },
  colDesc: { flex: 3, paddingRight: 4 },
  colQty: { flex: 1, textAlign: 'right' },
  colRate: { flex: 1.5, textAlign: 'right' },
  colTotal: { flex: 1.5, textAlign: 'right' },
  totalsBox: { marginTop: 12, alignSelf: 'flex-end', width: 220 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 3 },
  grandTotal: {
    fontWeight: 700,
    fontSize: 12,
    borderTop: `1pt solid ${pdfColors.border}`,
    paddingTop: 4,
    marginTop: 4,
  },
  footer: {
    position: 'absolute',
    bottom: 24,
    left: 48,
    right: 48,
    fontSize: 8,
    color: pdfColors.muted,
    textAlign: 'center',
  },
})

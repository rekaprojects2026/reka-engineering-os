/**
 * lib/files/naming.ts
 * File naming system utilities.
 * Pure functions — no DB calls.
 */

export interface FileNamingConfig {
  project_prefix: string
  separator: string
  revision_format: string
  discipline_codes: string
  doc_type_codes: string
}

export const DEFAULT_FILE_NAMING: FileNamingConfig = {
  project_prefix: 'RKA',
  separator: '-',
  revision_format: 'R0_RA_RB',
  discipline_codes: 'MCH:Mechanical,CVL:Civil',
  doc_type_codes: 'DR:Drawing,CA:Calculation,RP:Report',
}

/** Parse string "KEY:Label,KEY2:Label2" menjadi array {value, label} */
export function parseCodeMap(raw: string): Array<{ value: string; label: string }> {
  if (!raw.trim()) return []
  return raw
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => {
      const colon = entry.indexOf(':')
      if (colon === -1) {
        const value = entry.trim()
        return { value, label: value }
      }
      const value = entry.slice(0, colon).trim()
      const label = entry.slice(colon + 1).trim() || value
      return { value, label }
    })
}

/** Format revision berdasarkan config */
export function formatRevision(revisionIndex: number, format: string): string {
  if (format === 'NUM') {
    return revisionIndex.toString().padStart(2, '0')
  }
  if (format === 'Rev0_RevA_RevB') {
    if (revisionIndex === 0) return 'Rev0'
    return `Rev${String.fromCharCode(64 + revisionIndex)}`
  }
  if (revisionIndex === 0) return 'R0'
  return `R${String.fromCharCode(64 + revisionIndex)}`
}

/** Generate file code */
export function generateFileCode(params: {
  projectCode: string
  disciplineCode: string
  docTypeCode: string
  sequenceNumber: number
  revisionIndex: number
  separator: string
  revisionFormat: string
}): string {
  const sep = params.separator
  const seqStr = params.sequenceNumber.toString().padStart(3, '0')
  const revStr = formatRevision(params.revisionIndex, params.revisionFormat)

  return [
    params.projectCode,
    params.disciplineCode.toUpperCase(),
    params.docTypeCode.toUpperCase(),
    seqStr,
    revStr,
  ].join(sep)
}

/** Generate project code dari prefix + tahun + nomor urut (client/preview; DB trigger mirrors logic) */
export function generateProjectCode(prefix: string, year: number, sequenceNumber: number): string {
  const yearShort = year.toString().slice(-2)
  const seqStr = sequenceNumber.toString().padStart(2, '0')
  return `${prefix}${yearShort}${seqStr}`
}

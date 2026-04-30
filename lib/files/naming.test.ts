import { describe, expect, it } from 'vitest'
import { formatRevision, generateFileCode, generateProjectCode } from './naming'

describe('generateFileCode', () => {
  it('joins project code, discipline, doc type, sequence, and revision with separator', () => {
    const code = generateFileCode({
      projectCode: 'RKA2601-M',
      disciplineCode: 'mch',
      docTypeCode: 'dr',
      sequenceNumber: 1,
      revisionIndex: 0,
      separator: '-',
      revisionFormat: 'R0_RA_RB',
    })
    expect(code).toBe('RKA2601-M-MCH-DR-001-R0')
  })

  it('pads sequence to three digits', () => {
    const code = generateFileCode({
      projectCode: 'P',
      disciplineCode: 'X',
      docTypeCode: 'Y',
      sequenceNumber: 42,
      revisionIndex: 0,
      separator: '_',
      revisionFormat: 'NUM',
    })
    expect(code).toBe('P_X_Y_042_00')
  })
})

describe('formatRevision', () => {
  it('uses NUM format', () => {
    expect(formatRevision(0, 'NUM')).toBe('00')
    expect(formatRevision(3, 'NUM')).toBe('03')
  })

  it('uses letter revision after R0', () => {
    expect(formatRevision(0, 'R0_RA_RB')).toBe('R0')
    expect(formatRevision(1, 'R0_RA_RB')).toBe('RA')
  })
})

describe('generateProjectCode', () => {
  it('combines prefix, two-digit year, and padded sequence', () => {
    expect(generateProjectCode('RKA', 2026, 3)).toBe('RKA2603')
  })
})

'use client'

import { useActionState, useTransition, type CSSProperties } from 'react'
import { confirmCompensation, deleteCompensation, returnCompensation } from '@/lib/compensation/actions'

const box: CSSProperties = {
  padding: '10px 12px',
  marginBottom: '10px',
  borderRadius: 'var(--radius-control)',
  backgroundColor: 'var(--color-danger-subtle)',
  color: 'var(--color-danger)',
  fontSize: '0.8125rem',
}

const label: CSSProperties = {
  display: 'block',
  fontSize: '0.75rem',
  fontWeight: 600,
  color: 'var(--text-secondary-neutral)',
  marginBottom: '4px',
}

const input: CSSProperties = {
  width: '100%',
  padding: '8px 10px',
  fontSize: '0.8125rem',
  border: '1px solid var(--input-border)',
  borderRadius: 'var(--radius-control)',
  color: 'var(--text-primary-neutral)',
  outline: 'none',
}

export function CompensationRecordActions({
  compensationId,
  status,
  proposedBy,
  currentUserId,
  isFinance,
  canDelete,
}: {
  compensationId: string
  status: string
  proposedBy: string | null
  currentUserId: string
  isFinance: boolean
  canDelete: boolean
}) {
  const [delPending, startDel] = useTransition()

  const [confirmState, confirmFormAction, confirmPending] = useActionState(
    async (_prev: { error: string } | null, formData: FormData) => {
      const res = await confirmCompensation(compensationId, formData)
      if (res?.error) return { error: res.error }
      return null
    },
    null,
  )

  const [returnState, returnFormAction, returnPending] = useActionState(
    async (_prev: { error: string } | null, formData: FormData) => {
      const res = await returnCompensation(compensationId, formData)
      if (res?.error) return { error: res.error }
      return null
    },
    null,
  )

  const showFinanceDraft = isFinance && status === 'draft'
  const ownDraft = status === 'draft' && proposedBy === currentUserId

  function onDelete() {
    if (!window.confirm('Hapus draft kompensasi ini?')) return
    startDel(async () => {
      const res = await deleteCompensation(compensationId)
      if (res?.error) {
        window.alert(res.error)
      }
    })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {showFinanceDraft && (
        <div>
          <h3 style={{ fontSize: '0.8125rem', fontWeight: 600, marginBottom: '10px', color: 'var(--text-primary-neutral)' }}>
            Tindakan Finance
          </h3>
          <form action={confirmFormAction} style={{ marginBottom: '14px' }}>
            {confirmState?.error && <div style={box}>{confirmState.error}</div>}
            <label style={label}>Catatan Finance (opsional)</label>
            <textarea name="finance_note" rows={2} style={{ ...input, resize: 'vertical', marginBottom: '8px' }} />
            <button
              type="submit"
              disabled={confirmPending}
              style={{
                padding: '8px 16px',
                border: 'none',
                borderRadius: 'var(--radius-control)',
                fontSize: '0.8125rem',
                fontWeight: 600,
                color: 'var(--color-primary-fg)',
                backgroundColor: 'var(--color-primary)',
                cursor: confirmPending ? 'not-allowed' : 'pointer',
                opacity: confirmPending ? 0.75 : 1,
              }}
            >
              {confirmPending ? 'Mengonfirmasi…' : 'Konfirmasi'}
            </button>
          </form>

          <form action={returnFormAction}>
            {returnState?.error && <div style={box}>{returnState.error}</div>}
            <label style={label}>Kembalikan ke proposer — catatan wajib</label>
            <textarea name="return_note" required rows={3} style={{ ...input, resize: 'vertical', marginBottom: '8px' }} />
            <button
              type="submit"
              disabled={returnPending}
              style={{
                padding: '8px 16px',
                border: '1px solid var(--border-strong-neutral)',
                borderRadius: 'var(--radius-control)',
                fontSize: '0.8125rem',
                fontWeight: 600,
                color: 'var(--color-danger)',
                backgroundColor: 'var(--surface-card)',
                cursor: returnPending ? 'not-allowed' : 'pointer',
              }}
            >
              {returnPending ? 'Mengirim…' : 'Kembalikan untuk revisi'}
            </button>
          </form>
        </div>
      )}

      {(canDelete && ownDraft) || (canDelete && isFinance) ? (
        <div>
          <button
            type="button"
            onClick={onDelete}
            disabled={delPending}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              backgroundColor: 'var(--color-danger-subtle)',
              border: '1px solid var(--color-border-strong)',
              borderRadius: 'var(--radius-control)',
              fontSize: '0.8125rem',
              fontWeight: 500,
              color: 'var(--color-danger)',
              cursor: delPending ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit',
              opacity: delPending ? 0.7 : 1,
            }}
          >
            {delPending ? 'Menghapus…' : 'Tarik / hapus draft'}
          </button>
        </div>
      ) : null}

    </div>
  )
}

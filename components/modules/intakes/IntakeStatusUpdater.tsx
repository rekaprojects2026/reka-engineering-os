'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { InlineStatusSelect } from '@/components/shared/InlineStatusSelect'
import { IntakeStatusBadge } from '@/components/modules/intakes/IntakeStatusBadge'
import {
  ConvertLeadButton,
  type ConvertLeadClientOption,
  type ConvertLeadUserOption,
} from '@/components/modules/leads/ConvertLeadButton'
import { INTAKE_STATUS_OPTIONS } from '@/lib/constants/options'
import { updateIntakeStatus } from '@/lib/intakes/actions'

const STATUS_CHOICES = INTAKE_STATUS_OPTIONS.filter((o) => o.value !== 'converted').map((o) => ({
  value: o.value,
  label: o.label,
}))

interface IntakeStatusUpdaterProps {
  intakeId: string
  currentStatus: string
  leadTitle: string
  clientName: string
  clients: ConvertLeadClientOption[]
  users: ConvertLeadUserOption[]
  linkedClientId?: string | null
  /** If true, show badge only (e.g. already converted). */
  readOnly?: boolean
}

export function IntakeStatusUpdater({
  intakeId,
  currentStatus,
  leadTitle,
  clientName,
  clients,
  users,
  linkedClientId = null,
  readOnly,
}: IntakeStatusUpdaterProps) {
  const router = useRouter()
  const [showClosedModal, setShowClosedModal] = useState(false)
  const [showConvertForm, setShowConvertForm] = useState(false)

  if (readOnly) {
    return <IntakeStatusBadge status={currentStatus} />
  }

  async function handleStatusChange(newStatus: string) {
    const result = await updateIntakeStatus(intakeId, newStatus)
    if (result && 'error' in result) {
      throw new Error(result.error)
    }
    await router.refresh()
    if (newStatus === 'closed') {
      setShowClosedModal(true)
    }
  }

  return (
    <>
      <div key={`${intakeId}-${currentStatus}`} style={{ display: 'inline-flex' }}>
        <InlineStatusSelect
          currentStatus={currentStatus}
          options={STATUS_CHOICES}
          onUpdate={handleStatusChange}
          renderBadge={(s) => <IntakeStatusBadge status={s} />}
        />
      </div>

      {showClosedModal && !showConvertForm && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 50,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowClosedModal(false)
            }
          }}
        >
          <div
            style={{
              backgroundColor: 'var(--surface-card)',
              border: '1px solid var(--border-default)',
              borderRadius: 'var(--radius-card)',
              width: '100%',
              maxWidth: '480px',
              padding: '24px',
              boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
            }}
          >
            <h2
              style={{
                fontSize: '1.0625rem',
                fontWeight: 700,
                color: 'var(--text-primary-neutral)',
                margin: 0,
              }}
            >
              Lead ditutup 🎉
            </h2>
            <p
              style={{
                fontSize: '0.875rem',
                color: 'var(--text-muted-neutral)',
                marginTop: '8px',
                lineHeight: 1.5,
              }}
            >
              Mau langsung buat project dari lead ini?
            </p>
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '10px',
                marginTop: '20px',
                justifyContent: 'flex-end',
              }}
            >
              <button
                type="button"
                onClick={() => {
                  setShowClosedModal(false)
                }}
                style={{
                  padding: '8px 16px',
                  border: '1px solid var(--input-border)',
                  borderRadius: 'var(--radius-control)',
                  backgroundColor: 'transparent',
                  color: 'var(--text-secondary-neutral)',
                  fontSize: '0.8125rem',
                  fontWeight: 500,
                  cursor: 'pointer',
                }}
              >
                Nanti Saja
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowClosedModal(false)
                  setShowConvertForm(true)
                }}
                style={{
                  padding: '8px 18px',
                  border: 'none',
                  borderRadius: 'var(--radius-control)',
                  backgroundColor: 'var(--color-primary)',
                  color: 'var(--color-primary-fg)',
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Buat Project
              </button>
            </div>
          </div>
        </div>
      )}

      {showConvertForm && (
        <ConvertLeadButton
          key="convert-from-closed"
          leadId={intakeId}
          leadTitle={leadTitle}
          leadClientName={clientName}
          clients={clients}
          users={users}
          linkedClientId={linkedClientId}
          showTrigger={false}
          startOpen
          onFormClose={() => setShowConvertForm(false)}
        />
      )}
    </>
  )
}

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  draft:              { label: 'Draft',              color: '#94A3B8', bg: '#F1F5F9' },
  internal_review:    { label: 'Internal Review',    color: '#D97706', bg: '#FEF3C7' },
  ready_to_submit:    { label: 'Ready to Submit',    color: '#2563EB', bg: '#DBEAFE' },
  sent_to_client:     { label: 'Sent to Client',     color: '#7C3AED', bg: '#EDE9FE' },
  revision_requested: { label: 'Revision Requested', color: '#DC2626', bg: '#FEE2E2' },
  approved:           { label: 'Approved',           color: '#16A34A', bg: '#DCFCE7' },
  final_issued:       { label: 'Final Issued',       color: '#059669', bg: '#D1FAE5' },
}

export function DeliverableStatusBadge({ status }: { status: string }) {
  const cfg = statusConfig[status] ?? { label: status, color: '#94A3B8', bg: '#F1F5F9' }
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '2px 10px',
        borderRadius: '12px',
        fontSize: '0.6875rem',
        fontWeight: 600,
        color: cfg.color,
        backgroundColor: cfg.bg,
        whiteSpace: 'nowrap',
      }}
    >
      {cfg.label}
    </span>
  )
}

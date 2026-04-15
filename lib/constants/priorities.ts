// Priority levels and their display metadata

export const PRIORITIES = {
  LOW:    { label: 'Low',    color: '#64748B', bgColor: '#F1F5F9' },
  MEDIUM: { label: 'Medium', color: '#D97706', bgColor: '#FEF3C7' },
  HIGH:   { label: 'High',   color: '#DC2626', bgColor: '#FEE2E2' },
  URGENT: { label: 'Urgent', color: '#FFFFFF', bgColor: '#DC2626' },
} as const

export type Priority = keyof typeof PRIORITIES

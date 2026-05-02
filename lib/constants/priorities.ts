export const PRIORITIES = {
  LOW:    { label: 'Low',    color: '#8A8A8A', bgColor: '#F0F0F0' },
  MEDIUM: { label: 'Medium', color: '#B45309', bgColor: '#F3F4F6' },
  HIGH:   { label: 'High',   color: '#991B1B', bgColor: '#FEF2F2' },
  URGENT: { label: 'Urgent', color: '#FFFFFF', bgColor: '#B91C1C' },
} as const

export type Priority = keyof typeof PRIORITIES

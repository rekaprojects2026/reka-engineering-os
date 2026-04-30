export const PRIORITIES = {
  LOW:    { label: 'Low',    color: '#6A6666', bgColor: '#F1EFE8' },
  MEDIUM: { label: 'Medium', color: '#B45309', bgColor: '#FFFBEB' },
  HIGH:   { label: 'High',   color: '#851E1E', bgColor: '#F8E9E8' },
  URGENT: { label: 'Urgent', color: '#FFFDF7', bgColor: '#851E1E' },
} as const

export type Priority = keyof typeof PRIORITIES

import { NextResponse } from 'next/server'

export function apiSuccess<T>(data: T, meta?: Record<string, unknown>) {
  return NextResponse.json({ data, meta: meta ?? {} }, { status: 200 })
}

export function apiError(message: string, status: number, code?: string) {
  return NextResponse.json({ error: message, code: code ?? null }, { status })
}

export function apiUnauthorized() {
  return apiError('Unauthorized', 401, 'UNAUTHORIZED')
}

export function apiForbidden() {
  return apiError('Forbidden: insufficient scope', 403, 'FORBIDDEN')
}

export function apiNotFound(resource = 'Resource') {
  return apiError(`${resource} not found`, 404, 'NOT_FOUND')
}

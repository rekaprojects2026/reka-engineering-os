import type { Project } from '@/types/database'

/** Resolves multi-discipline array; falls back to legacy `discipline` when needed. */
export function normalizeProjectDisciplines(
  project: Pick<Project, 'disciplines' | 'discipline'>,
): string[] {
  if (Array.isArray(project.disciplines) && project.disciplines.length > 0) {
    return project.disciplines
  }
  if (project.discipline && project.discipline.trim()) {
    return [project.discipline.trim()]
  }
  return []
}

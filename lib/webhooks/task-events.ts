import { dispatchWebhook } from '@/lib/webhooks/dispatch'

/** Fire-and-forget when a task moves to done. */
export function fireTaskCompletedWebhook(
  previousStatus: string,
  nextStatus: string,
  taskId: string,
  projectId: string,
): void {
  if (nextStatus === 'done' && previousStatus !== 'done') {
    void dispatchWebhook('task.completed', {
      task_id: taskId,
      project_id: projectId,
    })
  }
}

export default function ProtectedLoading() {
  return (
    <div className="p-8 space-y-4 min-h-[40vh]">
      <div className="h-8 w-48 rounded bg-muted animate-pulse" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="h-32 rounded bg-muted animate-pulse" />
        <div className="h-32 rounded bg-muted animate-pulse" />
        <div className="h-32 rounded bg-muted animate-pulse" />
      </div>
      <div className="h-64 rounded bg-muted animate-pulse" />
    </div>
  )
}

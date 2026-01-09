"use client"

type DataErrorProps = {
  message: string
}

export function DataError({ message }: DataErrorProps) {
  return (
    <div
      role="alert"
      data-testid="data-error"
      className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive"
    >
      {message}
    </div>
  )
}

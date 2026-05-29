
interface CancelButtonProps {
  onCancel: () => void
  className?: string
}

export function CancelButton({ onCancel, className }: CancelButtonProps) {
  return (
    <button type="button" className={className} onClick={onCancel}>
      Cancel
    </button>
  )
}

type TextFieldProps = {
  id: string
  label: string
  name: string
  type?: string
  autoComplete?: string
  required?: boolean
  minLength?: number
}

export function TextField({ id, label, ...inputProps }: TextFieldProps) {
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm font-medium">
        {label}
      </label>
      <input
        id={id}
        {...inputProps}
        className="w-full rounded-md border border-neutral-500 bg-brand-paper px-3 py-2 text-brand-ink"
      />
    </div>
  )
}
import { useState } from 'react'

type NumberFieldProps = {
  id: string
  label: string
  value: number
  min: number
  max: number
  onCommit: (value: number) => void
}

function isAcceptable(text: string, min: number, max: number): boolean {
  const parsed = Number(text)
  return text.trim() !== '' && Number.isFinite(parsed) && parsed >= min && parsed <= max
}

export function NumberField({ id, label, value, min, max, onCommit }: NumberFieldProps) {
  const [text, setText] = useState(String(value))
  const [previous, setPrevious] = useState(value)

  // If the value changes from outside (for example Undo), show the new value.
  if (value !== previous) {
    setPrevious(value)
    if (Number(text) !== value) setText(String(value))
  }

  const valid = isAcceptable(text, min, max)

  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-xs font-medium">
        {label}
      </label>
      <input
        id={id}
        type="text"
        inputMode="decimal"
        value={text}
        aria-invalid={!valid}
        onChange={(event) => {
          const nextText = event.target.value
          setText(nextText)
          if (isAcceptable(nextText, min, max)) onCommit(Number(nextText))
        }}
        className={`w-full rounded-md border px-2 py-1 text-sm ${valid ? 'border-neutral-500' : 'border-red-700'}`}
      />
    </div>
  )
}
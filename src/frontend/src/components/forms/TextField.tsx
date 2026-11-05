import type { FieldError, UseFormRegisterReturn } from "react-hook-form"

type TextFieldProps = {
  label: string
  registration: UseFormRegisterReturn
  error?: FieldError
  type?: string
  autoComplete?: string
}

export function TextField({ label, registration, error, type = "text", autoComplete }: TextFieldProps) {
  return (
    <label className="field">
      <span>{label}</span>
      <input className="input" type={type} autoComplete={autoComplete} {...registration} />
      {error ? <small className="field-error">{error.message}</small> : null}
    </label>
  )
}

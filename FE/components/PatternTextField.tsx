import React from 'react'
import { PatternFormat } from 'react-number-format'

export interface PatternTextFieldProps {
  id: string
  name: string
  label: string
  value: string
  sequence: number
  error?: string
  isTouched?: boolean
  containerClassName?: string
  required?: boolean
  format: string
  mask?: string
  allowEmptyFormatting?: boolean
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onBlur: (e: React.FocusEvent<HTMLInputElement>) => void
  onFocus: (e: React.FocusEvent<HTMLInputElement>) => void
  placeholder?: string
}

export default function PatternTextField({
  id,
  name,
  label,
  value,
  sequence,
  error,
  isTouched,
  containerClassName,
  required = false,
  format,
  mask = ' ',
  allowEmptyFormatting = false,
  onChange,
  onBlur,
  onFocus,
  placeholder,
}: PatternTextFieldProps) {
  const showError = Boolean(error && isTouched)
  return (
    <div className={containerClassName} data-sequence={sequence}>
      <label
        htmlFor={id}
        className={`block text-sm font-medium mb-2 ${showError ? 'text-red-600' : 'text-gray-700'}`}
      >
        {label}
        {required ? <span style={{ marginLeft: 4 }}>*</span> : null}
      </label>
      <PatternFormat
        value={value}
        format={format}
        mask={mask}
        allowEmptyFormatting={false}
        onValueChange={({ formattedValue }) =>
          onChange({
            target: { name, value: formattedValue },
          } as unknown as React.ChangeEvent<HTMLInputElement>)
        }
        id={id}
        name={name}
        onBlur={onBlur}
        onFocus={onFocus}
        placeholder={placeholder}
        className={`w-full px-3 py-2.5 border rounded-lg focus:outline-none focus:border-primary transition-colors text-sm placeholder:opacity-0 focus:placeholder:opacity-100 placeholder:transition-opacity placeholder:duration-200 ${showError ? 'border-red-400 focus:ring-red-400 focus:border-red-400' : 'border-gray-300'}`}
      />
    </div>
  )
}

'use client'

import { useState, useEffect } from 'react'

interface CheckboxFieldProps {
  sequence: number
  name: string
  value?: string
  type?: string
  label?: string
  placeholder?: string
  required?: boolean
  className?: string
  onChange?: (value: string) => void
  onBlur?: (value: string) => void
}

export default function CheckboxField({
  sequence,
  name,
  value = '',
  label,
  required = false,
  className = '',
  onChange,
  onBlur,
}: CheckboxFieldProps) {
  const [checked, setChecked] = useState(false)

  // Keep internal state in sync when the parent-provided value changes
  useEffect(() => {
    const normalized = String(value).toLowerCase()
    setChecked(normalized === 'true')
  }, [value])

  const getDisplayLabel = (fieldName: string): string => {
    if (label) return `${label}`
    return fieldName.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nextChecked = e.target.checked
    setChecked(nextChecked)
    onChange?.(nextChecked ? 'True' : 'False')
  }

  const handleBlur = () => {
    onBlur?.(checked ? 'True' : 'False')
  }

  return (
    <div className={`${className}`} data-sequence={sequence}>
      <label className="flex items-center space-x-2 text-sm font-medium text-gray-700">
        <input
          type="checkbox"
          name={name}
          checked={checked}
          onChange={handleChange}
          onBlur={handleBlur}
          required={required}
          className="h-4 w-4 text-primary border-gray-300 rounded focus:border-primary"
        />
        <span
          title={getDisplayLabel(name)}
          style={{
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            flex: '1 1 auto',
            minWidth: 0,
          }}
        >
          {getDisplayLabel(name)}
          {required && <span style={{ marginLeft: 4 }}>*</span>}
        </span>
      </label>
    </div>
  )
}

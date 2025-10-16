'use client'

import { useEffect, useMemo, useState } from 'react'

export interface OptionItem {
  value: string
  label: string
  disabled?: boolean
}

type BackendOption = { key: string; name: string }

interface SelectOneFieldProps {
  sequence: number
  name: string
  value?: string
  label?: string
  placeholder?: string
  required?: boolean
  className?: string
  showChatButton?: boolean
  options: Array<OptionItem | string | BackendOption>
  onChange?: (value: string) => void
  onBlur?: (value: string) => void
  error?: string
  isTouched?: boolean
}

export default function SelectOneField({
  sequence,
  name,
  value = '',
  label,
  placeholder,
  required = false,
  className = '',
  showChatButton = false,
  options,
  onChange,
  onBlur,
  error,
  isTouched = false,
}: SelectOneFieldProps) {
  const [selected, setSelected] = useState(value)
  const [touched, setTouched] = useState(false)

  useEffect(() => {
    setSelected(value)
  }, [value])

  const normalizedOptions: OptionItem[] = useMemo(() => {
    if (!options || options.length === 0) return []
    const first = options[0] as unknown
    if (typeof first === 'string') {
      return (options as string[]).map(v => ({ value: v, label: v }))
    }
    // If already OptionItem
    if ((first as OptionItem).value !== undefined && (first as OptionItem).label !== undefined) {
      return options as OptionItem[]
    }
    // Backend shape: { key, name }
    return (options as BackendOption[]).map(o => ({ value: o.name, label: o.name }))
  }, [options])

  const getDisplayLabel = (fieldName: string): string => {
    if (label) return `${label}`
    return fieldName.replace(/_/g, ' ')
  }

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newValue = e.target.value
    setSelected(newValue)
    onChange?.(newValue)
  }

  const handleBlur = (e: React.FocusEvent<HTMLSelectElement>) => {
    setTouched(true)
    onBlur?.(e.target.value)
  }

  const showError = Boolean(error && isTouched) || (required && touched && !selected)

  return (
    <div className={`space-y-2 ${className}`} data-sequence={sequence}>
      <label
        className={`text-sm font-medium ${showError ? 'text-red-600' : 'text-gray-700'}`}
        style={{
          display: 'flex',
          alignItems: 'baseline',
          overflow: 'hidden',
          whiteSpace: 'nowrap',
        }}
      >
        <span
          title={getDisplayLabel(name)}
          style={{
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            flex: '0 1 auto',
            minWidth: 0,
          }}
        >
          {getDisplayLabel(name)}
        </span>
        {required && <span style={{ marginLeft: 4 }}>*</span>}
      </label>

      <div className="relative">
        <select
          name={name}
          value={selected}
          onChange={handleChange}
          onBlur={handleBlur}
          required={required}
          aria-invalid={showError || undefined}
          className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:border-primary appearance-none pl-8 bg-white text-sm ${
            selected ? 'text-gray-900' : 'text-gray-400'
          } ${showChatButton ? 'pr-20' : 'pr-8'} ${
            showError
              ? 'border-red-400 focus:ring-red-400 focus:border-red-400'
              : 'border-gray-300 focus:border-primary'
          }`}
          style={{ WebkitAppearance: 'none', MozAppearance: 'none' }}
        >
          <option value="">{placeholder ?? ''}</option>
          {normalizedOptions.map(opt => (
            <option key={`${name}-${opt.value}`} value={opt.value} disabled={opt.disabled}>
              {opt.label}
            </option>
          ))}
        </select>

        {/* Custom left caret icon to replace native dropdown arrow */}
        <div className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-gray-400">
          <i className="fas fa-chevron-down w-3 h-3"></i>
        </div>

        {showChatButton && (
          <div className="absolute top-1/2 right-2 -translate-y-1/2">
            <button
              type="button"
              className="flex items-center space-x-1 px-1 py-1 text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
            >
              <i className="far fa-comment w-3 h-3"></i>
              <span>chat</span>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

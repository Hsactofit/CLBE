'use client'

import { useState, useEffect } from 'react'

interface TextFieldProps {
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
  error?: string
  isTouched?: boolean
  containerClassName?: string
  onFocus?: (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => void
  id?: string
  showChatButton?: boolean
  rows?: number
}

export default function TextField({
  sequence,
  name,
  value = '',
  type,
  label,
  placeholder,
  required = false,
  className = '',
  onChange,
  onBlur,
  error,
  isTouched,
  containerClassName = '',
  onFocus,
  id,
  showChatButton = false,
  rows = 3,
}: TextFieldProps) {
  const [inputValue, setInputValue] = useState(value)

  // Keep internal state in sync when the parent-provided value changes
  useEffect(() => {
    setInputValue(value)
  }, [value])

  const getFieldType = (fieldName: string): string => {
    if (type) return type
    if (fieldName.includes('date') || fieldName.includes('birth')) {
      return 'date'
    }
    if (fieldName.includes('email')) {
      return 'email'
    }
    if (fieldName.includes('phone')) {
      return 'tel'
    }
    return 'text'
  }

  const getDisplayLabel = (fieldName: string): string => {
    if (label) return `${label}`
    return fieldName.replace(/_/g, ' ')
  }

  const getPlaceholder = (): string => {
    if (placeholder) return placeholder
    return ``
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const newValue = e.target.value
    setInputValue(newValue)
    onChange?.(newValue)
  }

  const handleInputBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    onBlur?.(e.target.value)
  }

  const handleCalendarClick = () => {
    const input = document.querySelector(`input[name="${name}"]`) as HTMLInputElement
    if (input) {
      if (input.showPicker) {
        input.showPicker()
      } else {
        input.click()
      }
    }
  }

  const isDateField = getFieldType(name) === 'date'
  const isTextarea = getFieldType(name) === 'textarea'

  const showError = Boolean(error && isTouched)

  return (
    <div className={`space-y-2 ${className} ${containerClassName}`} data-sequence={sequence}>
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
        {isTextarea ? (
          <textarea
            id={id}
            name={name}
            value={inputValue}
            onChange={handleInputChange}
            onBlur={handleInputBlur}
            onFocus={onFocus}
            required={required}
            rows={rows}
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none text-sm resize-none ${
              showError ? 'border-red-400' : 'border-gray-300'
            } focus:border-primary ${showChatButton ? 'pr-12' : ''}`}
            placeholder={getPlaceholder()}
          />
        ) : (
          <input
            id={id}
            type={getFieldType(name)}
            name={name}
            value={inputValue}
            onChange={handleInputChange}
            onBlur={handleInputBlur}
            onFocus={onFocus}
            required={required}
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none text-sm ${
              showError ? 'border-red-400' : 'border-gray-300'
            } focus:border-primary ${isDateField ? 'pr-24 hide-calendar-icon' : 'pr-12'}`}
            placeholder={getPlaceholder()}
          />
        )}

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

        {/* Calendar icon for date fields */}
        {isDateField && (
          <button
            type="button"
            onClick={handleCalendarClick}
            className="absolute top-1/2 -translate-y-1/2 flex items-center p-1 hover:bg-gray-100 rounded transition-colors"
            style={{ right: 4 }}
          >
            <i className="fas fa-calendar h-5 w-5 text-gray-400 hover:text-gray-600"></i>
          </button>
        )}
      </div>
    </div>
  )
}

'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/router'
import { useAuthFetch } from '@/hooks/useAuthFetch'
import LoadingSpinner from '@/components/LoadingSpinner'
import TextField from '@/components/TextField'
import SelectOneField, { OptionItem } from '@/components/SelectOneField'
import CheckboxField from '@/components/CheckboxField'
import { SubTitle, Title } from '@/components/Typography'
import { Typography } from 'antd'
import PatternTextField from '@/components/PatternTextField'
import { US_STATES } from '@/lib/usStates'

const { Text } = Typography

interface FormCompletionStepProps {
  projectId: string
  onStepCompleted?: () => void
}

export const FormCompletionStep: React.FC<FormCompletionStepProps> = ({
  projectId,
  onStepCompleted,
}) => {
  const router = useRouter()
  const authFetch = useAuthFetch()

  // Form selection state
  const [forms, setForms] = useState<
    Array<{
      publicId: string
      name?: string
      description?: string
      status?: string
      completed: boolean
      createdAt: string
      updatedAt: string
      formTemplateName: string
    }>
  >([])
  const [selectedFormId, setSelectedFormId] = useState<string | null>(null)

  // Form sections state
  const [activeTab, setActiveTab] = useState<string>('')
  const [sections, setSections] = useState<
    Array<{
      publicId: string
      sequence: number
      name: string
      type: string
      description: string
      status: string
      completedFields: number
      totalFields: number
    }>
  >([])
  const [sectionFields, setSectionFields] = useState<
    Array<{
      key: string
      name: string
      type: string
      subType: string
      value: string
      role: string
      optional: boolean
      sequence: number
      cssClass?: string
      options?: Array<OptionItem | string | { key: string; name: string }>
      isDependencyTarget?: boolean
    }>
  >([])

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [formName, setFormName] = useState<string>('')
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})

  // Load available forms for the project
  const loadForms = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await authFetch(`/projects/${projectId}/forms`)

      if (response.ok) {
        const data = await response.json()
        setForms(data.forms || [])

        // Auto-select first form if none selected
        if (data.forms && data.forms.length > 0 && !selectedFormId) {
          setSelectedFormId(data.forms[0].publicId)
        }
      } else {
        console.error('Failed to load forms:', response.status)
        setError('Failed to load forms. Please try again.')
      }
    } catch (err) {
      console.error('Error loading forms:', err)
      setError('An error occurred while loading forms.')
    } finally {
      setLoading(false)
    }
  }, [projectId, authFetch, selectedFormId])

  // Load sections for selected form
  const loadSections = useCallback(async () => {
    if (!selectedFormId) return

    try {
      setLoading(true)
      setError(null)

      const response = await authFetch(`/projects/${projectId}/forms/${selectedFormId}/sections`)

      if (response.ok) {
        const data = await response.json()
        setSections(data.sections || [])

        if (data.sections && data.sections.length > 0) {
          setActiveTab(data.sections[0].publicId)
        }
      } else {
        console.error('Failed to load sections:', response)
        setError('Failed to load sections. Please try again.')
      }
    } catch (err) {
      console.error('Error loading sections:', err)
      setError('An error occurred while loading sections.')
    } finally {
      setLoading(false)
    }
  }, [projectId, selectedFormId, authFetch])

  // Load section fields
  const loadSectionFields = useCallback(
    async (sectionId: string) => {
      if (!selectedFormId) return

      try {
        const response = await authFetch(
          `/projects/${projectId}/forms/${selectedFormId}/sections/${sectionId}`
        )

        if (response.ok) {
          const data = await response.json()
          setSectionFields(data.fields || [])
        } else {
          console.error('Failed to load section fields:', response)
          setError('Failed to load section fields. Please try again.')
        }
      } catch (err) {
        console.error('Error loading section fields:', err)
        setError('An error occurred while loading section fields.')
      }
    },
    [projectId, selectedFormId, authFetch]
  )

  // Load form name
  const loadFormName = useCallback(async () => {
    if (!projectId || !selectedFormId) return

    try {
      const response = await authFetch(`/projects/${projectId}/forms`)

      if (!response.ok) return

      const data = await response.json()
      const form = data.forms.find((f: { publicId: string }) => f.publicId === selectedFormId)
      setFormName(form?.formTemplateName || '')
    } catch (e) {
      console.error('Failed to load form name', e)
    }
  }, [projectId, selectedFormId, authFetch])

  useEffect(() => {
    if (projectId) {
      loadForms()
    }
  }, [projectId, loadForms])

  useEffect(() => {
    if (selectedFormId) {
      loadSections()
      loadFormName()
    }
  }, [selectedFormId, loadSections, loadFormName])

  useEffect(() => {
    if (activeTab) {
      loadSectionFields(activeTab)
    }
  }, [activeTab, loadSectionFields])

  const handleFieldChange = (key: string, role: string, newValue: string) => {
    setSectionFields(prevFields =>
      prevFields.map(f =>
        f.key === key && (f.role || '') === (role || '') ? { ...f, value: newValue } : f
      )
    )

    // Clear validation error for this field when user starts typing
    const fieldKey = `${key}-${role || ''}`
    if (validationErrors[fieldKey]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[fieldKey]
        return newErrors
      })
    }
  }

  const handleDependencyChange = async (key: string, role: string, newValue: string) => {
    // Update state immediately for UI responsiveness
    setSectionFields(prevFields => {
      const updatedFields = prevFields.map(f =>
        f.key === key && (f.role || '') === (role || '') ? { ...f, value: newValue } : f
      )
      return updatedFields
    })

    // Clear validation error for this field when user changes dependency
    const fieldKey = `${key}-${role || ''}`
    if (validationErrors[fieldKey]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[fieldKey]
        return newErrors
      })
    }

    await executeDependencySave(key, role, newValue)
  }

  // Execute the actual save operation for dependency changes (no validation)
  const executeDependencySave = async (key: string, role: string, newValue: string) => {
    if (!projectId || !selectedFormId || !activeTab) return

    try {
      // Get current state to ensure we have the latest values
      const currentFields = sectionFields.map(f => {
        if (f.key === key && (f.role || '') === (role || '')) {
          return { ...f, value: newValue }
        }
        return f
      })

      console.log(
        `Executing dependency save due to change in ${key} with value ${newValue}`,
        currentFields.map(f => ({ key: f.key, value: f.value, role: f.role }))
      )

      // Always save dependency changes without validation
      const result = await postSectionDataWithoutValidation(currentFields, false)

      if (result.ok) {
        await loadSectionFields(activeTab)
      }
    } catch (e) {
      console.error('Error handling dependency change:', e)
      setError('An error occurred while handling dependency change.')
    }
  }

  // Save data without validation (for drafts and dependency changes)
  const postSectionDataWithoutValidation = async (
    fieldsToSave: typeof sectionFields,
    complete = false
  ) => {
    if (!projectId || !selectedFormId || !activeTab) return { ok: false }

    try {
      setSaving(true)

      const response = await authFetch(
        `/projects/${projectId}/forms/${selectedFormId}/sections/${activeTab}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            fields: fieldsToSave.map(f => ({ key: f.key, value: f.value ?? '', role: f.role })),
            complete,
          }),
        }
      )

      if (!response.ok) {
        console.error('Failed to save section:', response.status)
        setError('Failed to save section. Please try again.')
      }

      return { ok: response.ok }
    } catch (e) {
      console.error('Error saving section:', e)
      setError('An error occurred while saving the section.')
      return { ok: false }
    } finally {
      setSaving(false)
    }
  }

  // Save data with validation (only for Next button)
  const postSectionData = async (fieldsToSave: typeof sectionFields, complete = false) => {
    if (!projectId || !selectedFormId || !activeTab) return { ok: false }

    try {
      setSaving(true)

      const response = await authFetch(
        `/projects/${projectId}/forms/${selectedFormId}/sections/${activeTab}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            fields: fieldsToSave.map(f => ({ key: f.key, value: f.value ?? '', role: f.role })),
            complete,
          }),
        }
      )

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Failed to save section:', response.status, errorText)
        setError(`Failed to save section: ${errorText}`)
      }

      return { ok: response.ok }
    } catch (e) {
      console.error('Error saving section:', e)
      setError('An error occurred while saving the section.')
      return { ok: false }
    } finally {
      setSaving(false)
    }
  }

  const resolveWidth = (cssClassValue?: string): string => {
    if (!cssClassValue) return '25%'
    const tokens = cssClassValue.trim().toLowerCase().split(/\s+/)

    // Explicit percentage wins
    const percentToken = tokens.find(t => /^\d+%$/.test(t))
    if (percentToken) return percentToken

    // Named widths
    if (tokens.includes('full')) return '100%'
    if (tokens.includes('three-quarters')) return '75%'
    if (tokens.includes('two-thirds')) return '66.6667%'
    if (tokens.includes('half')) return '50%'
    if (tokens.includes('third')) return '33.3333%'
    if (tokens.includes('quarter') || tokens.includes('1/4')) return '25%'

    return '25%'
  }

  const validateFields = () => {
    const errors: Record<string, string> = {}

    sectionFields.forEach(field => {
      const fieldKey = `${field.key}-${field.role || ''}`

      // Check required fields
      if (!field.optional && (!field.value || field.value.trim() === '')) {
        errors[fieldKey] = `${field.name} is required`
      }

      // Type-specific validation
      if (field.value && field.value.trim() !== '') {
        switch (field.subType) {
          case 'SSN':
            if (field.value.replace(/\D/g, '').length !== 9) {
              errors[fieldKey] = 'SSN must be 9 digits'
            }
            break
          case 'ZIP_CODE':
            if (field.value.replace(/\D/g, '').length !== 5) {
              errors[fieldKey] = 'ZIP code must be 5 digits'
            }
            break
          case 'EMAIL':
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
            if (!emailRegex.test(field.value)) {
              errors[fieldKey] = 'Please enter a valid email address'
            }
            break

          case 'US_TELEPHONE':
            const telephoneRegex = /^\(\d{3}\) \d{3}-\d{4}$/
            if (!telephoneRegex.test(field.value)) {
              errors[fieldKey] = 'Please enter a valid US telephone number in format (123) 456-7890'
            }
            break
        }
      }
    })

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSave = async () => {
    await postSectionDataWithoutValidation(sectionFields, false)

    // Check if all required fields are complete
    const allRequiredFieldsComplete = sectionFields.every(field => {
      if (field.optional) return true
      return field.value && field.value.trim() !== ''
    })

    // If all required fields are complete, automatically go to next section
    if (allRequiredFieldsComplete) {
      const currentIndex = sections.findIndex(s => s.publicId === activeTab)
      if (currentIndex >= 0 && currentIndex < sections.length - 1) {
        setActiveTab(sections[currentIndex + 1].publicId)
      }
    } else {
      // Show validation errors for incomplete required fields
      sectionFields.forEach(field => {
        if (!field.optional && (!field.value || field.value.trim() === '')) {
          setValidationErrors(prev => {
            const newErrors = { ...prev }
            newErrors[`${field.key}-${field.role || ''}`] = `${field.name} is required`
            return newErrors
          })
        }
      })
    }
  }

  const completeWorkflowStep = async () => {
    try {
      // Call the steps endpoint to refresh the workflow
      const response = await authFetch(`/projects/${projectId}/steps`)

      if (response.ok) {
        // Call the parent callback to refresh the progress tracker
        if (onStepCompleted) {
          onStepCompleted()
        }
      } else {
        console.error('Failed to refresh workflow steps:', response.status)
        setError('Failed to complete workflow step. Please try again.')
      }
    } catch (err) {
      console.error('Error completing workflow step:', err)
      setError('An error occurred while completing the workflow step.')
    }
  }

  const handleNext = async () => {
    // Run validation before proceeding
    if (!validateFields()) {
      return
    }

    const result = await postSectionData(sectionFields, true)
    if (!result.ok) return

    const currentIndex = sections.findIndex(s => s.publicId === activeTab)
    const isLastSection = currentIndex >= 0 && currentIndex === sections.length - 1

    if (isLastSection) {
      // If this is the last section, complete the workflow step
      await completeWorkflowStep()
    } else if (currentIndex >= 0 && currentIndex < sections.length - 1) {
      // Otherwise, move to next section
      setActiveTab(sections[currentIndex + 1].publicId)
    }

    // Update the progress tracker after all operations are complete
    // Add a small delay to ensure the backend has finished processing the workflow updates
    setTimeout(() => {
      if (onStepCompleted) {
        onStepCompleted()
      }
    }, 500) // 500ms delay to allow backend processing to complete
  }

  if (loading) {
    return <LoadingSpinner />
  }

  if (error) {
    return (
      <div className="text-center">
        <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Form</h3>
        <p className="text-gray-600 mb-4">{error}</p>
        <button
          onClick={() => {
            setError(null)
            loadForms()
          }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          Try Again
        </button>
      </div>
    )
  }

  // Show form selection if no form is selected or if there are multiple forms
  if (!selectedFormId || (forms.length > 1 && !activeTab)) {
    return (
      <div className="space-y-6">
        <div>
          <Title className="text-2xl font-bold text-gray-900">Select Form to Complete</Title>
          <SubTitle className="!ml-0">Choose a form to begin completing</SubTitle>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Form
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {forms.map(form => (
                <tr key={form.publicId} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center mr-3">
                        <i className="fas fa-file-lines w-4 h-4 text-gray-400"></i>
                      </div>
                      <div className="text-sm font-medium text-gray-900">
                        {form.formTemplateName || form.name}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full border ${
                        form.completed
                          ? 'bg-green-100 text-green-800 border-green-400'
                          : 'bg-gray-100 text-gray-800 border-gray-400'
                      }`}
                    >
                      {form.completed ? 'Completed' : 'Not Started'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <button
                      onClick={() => setSelectedFormId(form.publicId)}
                      className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-gradient-to-r from-primary to-secondary hover:from-primary-600 hover:to-secondary-600 transition-all duration-200"
                    >
                      {form.completed ? 'View' : 'Complete'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  // Show form filling interface
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Title className="text-2xl font-bold text-gray-900">{formName || ''}</Title>
          <SubTitle className="!ml-0">Complete the form section by section</SubTitle>
        </div>
        {forms.length > 1 && (
          <button
            onClick={() => {
              setSelectedFormId(null)
              setActiveTab('')
              setSections([])
              setSectionFields([])
            }}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors"
          >
            <i className="fas fa-arrow-left w-4 h-4 mr-2"></i>
            Back to Forms
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-gray-200 pb-2">
        {sections
          .sort((a, b) => a.sequence - b.sequence)
          .map(section => (
            <button
              key={section.publicId}
              onClick={() => setActiveTab(section.publicId)}
              className={`px-4 py-1 text-sm font-medium rounded-t-lg transition-colors ${
                activeTab === section.publicId
                  ? 'bg-white text-primary border-b-2 border-primary'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              {section.name?.split('_').join(' ')}
            </button>
          ))}
      </div>

      {/* Tab Content */}
      {activeTab && (
        <div className="space-y-6">
          {/* Form Fields */}
          <div className="flex flex-wrap" style={{ marginLeft: -8, marginRight: -8 }}>
            {sectionFields
              .sort((a, b) => a.sequence - b.sequence)
              .map((field, index) => {
                const key = `${activeTab}-${field.name}-${field.role || ''}-${field.sequence ?? index}`
                const fieldKey = `${field.key}-${field.role || ''}`
                const sequence = field.sequence ?? index
                const width = resolveWidth(field.cssClass)
                const hasError = Boolean(validationErrors[fieldKey])
                const errorMessage = validationErrors[fieldKey]
                let placeholder = null as string | null
                let format = null as string | null

                switch (field.subType) {
                  case 'SSN':
                    format = '###-##-####'
                    placeholder = '987-65-4321'
                    break
                  case 'ZIP_CODE':
                    format = '#####'
                    placeholder = '98765'
                    break
                  case 'US_TELEPHONE':
                    format = '(###) ###-####'
                    placeholder = '(987) 654-3210'
                    break
                  case 'FEIN':
                    format = '##-#######'
                    placeholder = '98-7654321'
                    break
                }

                const itemStyle = {
                  flex: `0 0 ${width}`,
                  maxWidth: width,
                  boxSizing: 'border-box' as const,
                  paddingLeft: 8,
                  paddingRight: 8,
                }

                switch (field.type) {
                  case 'SELECT_ONE':
                    const options = field.options || []
                    return (
                      <div key={key} style={itemStyle} className={`field-card ${field.cssClass}`}>
                        <SelectOneField
                          sequence={sequence}
                          name={field.name}
                          value={field.value || ''}
                          required={!field.optional}
                          options={options}
                          error={errorMessage}
                          isTouched={hasError}
                          onChange={(value: string) =>
                            field.isDependencyTarget
                              ? handleDependencyChange(field.key, field.role, value)
                              : handleFieldChange(field.key, field.role, value)
                          }
                        />
                      </div>
                    )

                  case 'BOOLEAN':
                    return (
                      <div key={key} style={itemStyle} className={`field-card ${field.cssClass}`}>
                        <CheckboxField
                          sequence={sequence}
                          name={field.name}
                          value={field.value || ''}
                          required={!field.optional}
                          onChange={(value: string) =>
                            field.isDependencyTarget
                              ? handleDependencyChange(field.key, field.role, value)
                              : handleFieldChange(field.key, field.role, value)
                          }
                        />
                      </div>
                    )

                  case 'NUMBER':
                    return (
                      <div key={key} style={itemStyle} className={`field-card ${field.cssClass}`}>
                        <PatternTextField
                          sequence={sequence}
                          containerClassName="flex-1"
                          id={field.name}
                          name={field.name}
                          label={field.name}
                          value={field.value || ''}
                          error={errorMessage || ''}
                          isTouched={hasError}
                          required={!field.optional}
                          onChange={e =>
                            field.isDependencyTarget
                              ? handleDependencyChange(field.key, field.role, e.target.value)
                              : handleFieldChange(field.key, field.role, e.target.value)
                          }
                          onBlur={() => {}}
                          onFocus={() => {}}
                          format="######"
                        />
                      </div>
                    )
                  case 'TEXT':
                    if (field.subType === 'US_STATE') {
                      const stateOptions = US_STATES.map(state => ({
                        value: state.code,
                        label: `${state.code} - ${state.name}`,
                      }))

                      return (
                        <div key={key} style={itemStyle} className={`field-card ${field.cssClass}`}>
                          <SelectOneField
                            sequence={sequence}
                            name={field.name}
                            value={field.value || ''}
                            required={!field.optional}
                            options={stateOptions}
                            error={errorMessage}
                            isTouched={hasError}
                            onChange={(value: string) =>
                              field.isDependencyTarget
                                ? handleDependencyChange(field.key, field.role, value)
                                : handleFieldChange(field.key, field.role, value)
                            }
                          />
                        </div>
                      )
                    } else if (format && placeholder) {
                      return (
                        <div key={key} style={itemStyle} className={`field-card ${field.cssClass}`}>
                          <PatternTextField
                            sequence={sequence}
                            containerClassName="flex-1"
                            id={field.name}
                            name={field.name}
                            label={field.name}
                            placeholder={placeholder}
                            value={field.value || ''}
                            error={errorMessage || ''}
                            isTouched={hasError}
                            required
                            onChange={e =>
                              field.isDependencyTarget
                                ? handleDependencyChange(field.key, field.role, e.target.value)
                                : handleFieldChange(field.key, field.role, e.target.value)
                            }
                            onBlur={() => {}}
                            onFocus={() => {}}
                            format={format}
                          />
                        </div>
                      )
                    } else {
                      return (
                        <div key={key} style={itemStyle} className={`field-card ${field.cssClass}`}>
                          <TextField
                            showChatButton={false}
                            sequence={sequence}
                            name={field.name}
                            value={field.value || ''}
                            required={!field.optional}
                            error={errorMessage}
                            isTouched={hasError}
                            onChange={(value: string) =>
                              field.isDependencyTarget
                                ? handleDependencyChange(field.key, field.role, value)
                                : handleFieldChange(field.key, field.role, value)
                            }
                          />
                        </div>
                      )
                    }
                    break
                  default:
                    return <></>
                }
              })}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
            <button
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center justify-center px-4 py-2 border text-sm font-medium rounded-md bg-white text-primary border-primary hover:bg-gray-50 disabled:opacity-60 disabled:cursor-not-allowed"
              style={{ width: 150 }}
            >
              <i className="fas fa-save w-4 h-4 mr-2"></i>
              {saving ? 'Saving…' : 'Save Draft'}
            </button>
            <button
              onClick={handleNext}
              disabled={saving}
              className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-gradient-to-r from-primary to-secondary hover:from-primary-600 hover:to-secondary-600 disabled:opacity-60 disabled:cursor-not-allowed"
              style={{ width: 150 }}
            >
              {(() => {
                const currentIndex = sections.findIndex(s => s.publicId === activeTab)

                return (
                  <>
                    <i className="fas fa-arrow-right w-4 h-4 mr-2"></i>
                    Next
                  </>
                )
              })()}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

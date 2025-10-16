'use client'
import TextField from '../TextField'
import SelectOneField from '../SelectOneField'
import CheckboxField from '../CheckboxField'
import { Text, Heading } from '@/components/Typography'
import { useCallback, useEffect, useState } from 'react'
import { useAuthFetch } from '@/hooks/useAuthFetch'
import { useAuth } from '@clerk/nextjs'
import router from 'next/router'
import { ProjectType } from '@/types/api'
import { ProjectFilingType } from '@/lib/enums'
import { Project } from '@/types/project'

interface ProjectFormProps {
  setShowNewProjectModal: (show: boolean) => void
  project: Project
}

interface FormData {
  beneficiaryFirstName: string
  beneficiaryLastName: string
  positionTitle: string
  typeId: string
  filingType: string
  deadline: string
  priority: string
  premiumProcessing: boolean
  notes: string
}

const filingTypes = [
  { label: 'Lottery', value: ProjectFilingType.LOTTERY },
  { label: 'New Filing', value: ProjectFilingType.NEW_FILING },
  { label: 'Transfer', value: ProjectFilingType.TRANSFER },
  { label: 'Extension', value: ProjectFilingType.EXTENSION },
  { label: 'Amendment', value: ProjectFilingType.AMENDMENT },
]

const priorityOptions = [
  { label: 'High', value: 'HIGH' },
  { label: 'Medium', value: 'MEDIUM' },
  { label: 'Low', value: 'LOW' },
]

export const ProjectForm = ({
  setShowNewProjectModal,
  project: initialProjectValues,
}: ProjectFormProps) => {
  const authFetch = useAuthFetch()
  const { isSignedIn } = useAuth()
  const [types, setTypes] = useState<Array<{ label: string; value: string; disabled?: boolean }>>(
    []
  )
  const [form, setForm] = useState<FormData>({
    beneficiaryFirstName: initialProjectValues.beneficiaryFirstName || '',
    beneficiaryLastName: initialProjectValues.beneficiaryLastName || '',
    positionTitle: initialProjectValues.positionTitle || '',
    typeId: initialProjectValues.typeId || '',
    filingType: initialProjectValues.filingType || '',
    deadline: initialProjectValues.deadline || '',
    priority: initialProjectValues.priority || '',
    premiumProcessing: initialProjectValues.premiumProcessing || false,
    notes: initialProjectValues.notes || '',
  })
  const [errors, setErrors] = useState({} as Record<string, string>)
  const [touched, setTouched] = useState({} as Record<string, boolean>)

  const loadProjectTypes = useCallback(async () => {
    try {
      const response = await authFetch(`/projects/types`)

      if (response.ok) {
        const data: { types: ProjectType[] } = await response.json()
        const typeResponse = data.types
          .sort((a, b) => {
            if (a.enabled !== b.enabled) return a.enabled ? -1 : 1
            return a.sequence - b.sequence
          })
          .map((item: ProjectType) => ({
            label: item.name,
            value: item.id.toString(),
            disabled: !item.enabled,
          }))
        setTypes(typeResponse)
      } else {
        console.error('Failed to load projects:', response.status)
      }
    } catch (error) {
      console.error('Error loading projects:', error)
    }
  }, [authFetch])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    const finalValue = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    setForm(f => ({ ...f, [name]: finalValue }))
    setErrors(errs => ({ ...errs, [name]: '' }))
    setTouched(t => ({ ...t, [name]: true }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setForm(f => ({ ...f, [name]: value }))
    setErrors(errs => ({ ...errs, [name]: '' }))
    setTouched(t => ({ ...t, [name]: true }))
  }

  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setTouched(t => ({ ...t, [name]: true }))

    // Validation logic
    const requiredFields = [
      'beneficiaryFirstName',
      'beneficiaryLastName',
      'positionTitle',
      'typeId',
      'filingType',
      'priority',
      'deadline',
    ]
    const isRequired = requiredFields.includes(name)
    const isValid = !isRequired || Boolean(value.trim())

    setErrors(errs => ({ ...errs, [name]: isValid ? '' : 'This field is required' }))
  }

  useEffect(() => {
    if (isSignedIn) {
      loadProjectTypes()
    }
  }, [isSignedIn, loadProjectTypes])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate all required fields
    const newErrors: Record<string, string> = {}
    const requiredFields = [
      'beneficiaryFirstName',
      'beneficiaryLastName',
      'positionTitle',
      'typeId',
      'filingType',
      'priority',
      'deadline',
    ]

    requiredFields.forEach(field => {
      const value = form[field as keyof FormData]
      if (!value || (typeof value === 'string' && !value.trim())) {
        newErrors[field] = 'This field is required'
      }
    })

    setErrors(newErrors)
    setTouched(Object.fromEntries(Object.keys(form).map(k => [k, true])))

    if (Object.keys(newErrors).length > 0) return

    try {
      const response = await authFetch('/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ...form }),
      })

      if (response.ok) {
        const body: Project = await response.json()
        const createdId = body.publicId
        if (createdId) {
          router.push(`/projects/${createdId}`)
        } else {
          console.error('Create project response missing publicId:', body)
        }
      } else {
        console.error('Failed to create project:', response.status)
      }
    } catch (error) {
      console.error('Error creating project:', error)
    }
  }

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 max-w-2xl w-full mx-4">
          <Heading className="!mb-0" level={3}>
            Create New Immigration Application
          </Heading>
          <Text className="mb-5">Fill in the required details below to get started.</Text>
          <form className="mt-5 space-y-4" onSubmit={handleSubmit} noValidate>
            <div className="flex gap-4">
              <TextField
                sequence={1}
                containerClassName="flex-1"
                name="beneficiaryFirstName"
                label="Beneficiary first name"
                placeholder="eg. John"
                value={form.beneficiaryFirstName}
                required
                error={errors.beneficiaryFirstName}
                isTouched={touched.beneficiaryFirstName}
                onChange={v =>
                  handleChange({
                    target: { name: 'beneficiaryFirstName', value: v },
                  } as unknown as React.ChangeEvent<HTMLInputElement>)
                }
                onBlur={v =>
                  handleBlur({
                    target: { name: 'beneficiaryFirstName', value: v },
                  } as unknown as React.FocusEvent<HTMLInputElement>)
                }
              />
              <TextField
                sequence={2}
                containerClassName="flex-1"
                name="beneficiaryLastName"
                label="Beneficiary last name"
                placeholder="eg. Smith"
                value={form.beneficiaryLastName}
                required
                error={errors.beneficiaryLastName}
                isTouched={touched.beneficiaryLastName}
                onChange={v =>
                  handleChange({
                    target: { name: 'beneficiaryLastName', value: v },
                  } as unknown as React.ChangeEvent<HTMLInputElement>)
                }
                onBlur={v =>
                  handleBlur({
                    target: { name: 'beneficiaryLastName', value: v },
                  } as unknown as React.FocusEvent<HTMLInputElement>)
                }
              />
              <TextField
                sequence={3}
                containerClassName="flex-1"
                name="positionTitle"
                label="Position title"
                placeholder="eg. Software Engineer"
                value={form.positionTitle}
                required
                error={errors.positionTitle}
                isTouched={touched.positionTitle}
                onChange={v =>
                  handleChange({
                    target: { name: 'positionTitle', value: v },
                  } as unknown as React.ChangeEvent<HTMLInputElement>)
                }
                onBlur={v =>
                  handleBlur({
                    target: { name: 'positionTitle', value: v },
                  } as unknown as React.FocusEvent<HTMLInputElement>)
                }
              />
            </div>

            <div className="flex gap-4">
              <div className="flex-1">
                <SelectOneField
                  sequence={4}
                  name="typeId"
                  label="Application type"
                  placeholder="Select Application Type"
                  value={form.typeId}
                  required
                  options={types}
                  error={errors.typeId}
                  isTouched={touched.typeId}
                  onChange={v => handleSelectChange('typeId', v)}
                  onBlur={v =>
                    handleBlur({
                      target: { name: 'typeId', value: v },
                    } as unknown as React.FocusEvent<HTMLInputElement>)
                  }
                />
              </div>
              <div className="flex-1">
                <SelectOneField
                  sequence={5}
                  name="filingType"
                  label="Filing type"
                  placeholder="Select Filing Type"
                  value={form.filingType}
                  required
                  options={filingTypes}
                  error={errors.filingType}
                  isTouched={touched.filingType}
                  onChange={v => handleSelectChange('filingType', v)}
                  onBlur={v =>
                    handleBlur({
                      target: { name: 'filingType', value: v },
                    } as unknown as React.FocusEvent<HTMLInputElement>)
                  }
                />
              </div>
            </div>

            <div className="flex gap-4">
              <TextField
                sequence={6}
                containerClassName="flex-1"
                name="deadline"
                label="Target deadline"
                type="date"
                placeholder="eg. 2023-12-31"
                value={form.deadline}
                required
                error={errors.deadline}
                isTouched={touched.deadline}
                onChange={v =>
                  handleChange({
                    target: { name: 'deadline', value: v },
                  } as unknown as React.ChangeEvent<HTMLInputElement>)
                }
                onBlur={v =>
                  handleBlur({
                    target: { name: 'deadline', value: v },
                  } as unknown as React.FocusEvent<HTMLInputElement>)
                }
              />
              <div className="flex-1">
                <SelectOneField
                  sequence={7}
                  name="priority"
                  label="Priority level"
                  placeholder="Select Priority"
                  value={form.priority}
                  required
                  options={priorityOptions}
                  error={errors.priority}
                  isTouched={touched.priority}
                  onChange={v => handleSelectChange('priority', v)}
                  onBlur={v =>
                    handleBlur({
                      target: { name: 'priority', value: v },
                    } as unknown as React.FocusEvent<HTMLInputElement>)
                  }
                />
              </div>
            </div>

            <div className="mt-6">
              <Text className="font-bold mb-2 block">Additional Options</Text>
              <div className="flex items-center">
                <CheckboxField
                  sequence={8}
                  name="premiumProcessing"
                  label="Add premium processing to application"
                  value={form.premiumProcessing ? 'true' : 'false'}
                  onChange={v =>
                    handleChange({
                      target: {
                        name: 'premiumProcessing',
                        value: v === 'true',
                        type: 'checkbox',
                      },
                    } as unknown as React.ChangeEvent<HTMLInputElement>)
                  }
                />
              </div>
            </div>

            <div className="flex">
              <TextField
                sequence={9}
                containerClassName="flex-1"
                name="notes"
                label="Case Notes"
                type="textarea"
                rows={8}
                placeholder="Brief description about requirements and background..."
                value={form.notes}
                error={errors.notes}
                isTouched={touched.notes}
                onChange={v =>
                  handleChange({
                    target: { name: 'notes', value: v },
                  } as unknown as React.ChangeEvent<HTMLInputElement>)
                }
                onBlur={v =>
                  handleBlur({
                    target: { name: 'notes', value: v },
                  } as unknown as React.FocusEvent<HTMLInputElement>)
                }
              />
            </div>

            <div className="flex justify-end gap-4 mt-6">
              <button
                type="button"
                onClick={() => setShowNewProjectModal(false)}
                className="px-6 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-r from-primary to-secondary hover:from-primary-600 hover:to-secondary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Create Application
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}

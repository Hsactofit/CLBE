/* eslint-disable @next/next/no-img-element */
import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Image from 'next/image'
import TextField from '@/components/TextField'
import SelectOneField from '@/components/SelectOneField'
import { useClerk } from '@clerk/nextjs'
import PatternTextField from '@/components/PatternTextField'
import { US_STATES } from '../../lib/usStates'

const initialForm = {
  clientName: '',
  tradeName: '',
  firstName: '',
  lastName: '',
  address: '',
  address2: '',
  city: '',
  state: '',
  zip: '',
  telephone: '',
  naicsCode: '',
  fein: '',
}

export default function ClientRegistrationPage() {
  const [form, setForm] = useState(initialForm)
  const [errors, setErrors] = useState({} as Record<string, string>)
  const [touched, setTouched] = useState({} as Record<string, boolean>)
  const router = useRouter()
  const { signOut } = useClerk()

  // One-time sign-out on first arrival to ensure no stale Clerk cookies interfere (robust against dev StrictMode)
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!router.isReady) return
    const clearedKey = 'registrationCleared'
    const clearedValue = 'true'
    const alreadyCleared = window.sessionStorage.getItem(clearedKey) === clearedValue
    const clearedParam = (router.query.cleared as string) === clearedValue

    if (alreadyCleared || clearedParam) {
      window.sessionStorage.setItem(clearedKey, clearedValue)
      return
    }

    window.sessionStorage.setItem(clearedKey, clearedValue)
    ;(async () => {
      try {
        await signOut()
        await router.replace(`${router.pathname}?cleared=${clearedValue}`)
      } catch {
        // ignore
      }
    })()
  }, [router, signOut])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setForm(f => ({ ...f, [name]: value }))
    setErrors(errs => ({ ...errs, [name]: '' }))
    setTouched(t => ({ ...t, [name]: true }))
  }

  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setTouched(t => ({ ...t, [name]: true }))
    const optionalFields = new Set(['tradeName', 'address2'])
    const isOptional = optionalFields.has(name)

    let isValid = Boolean(value.trim()) || isOptional

    if (name === 'telephone') {
      const digits = value.replace(/\D/g, '')
      isValid = digits.length === 10
    }
    if (name === 'zip') {
      const digits = value.replace(/\D/g, '')
      isValid = digits.length === 5
    }
    if (name === 'naicsCode') {
      const digits = value.replace(/\D/g, '')
      isValid = digits.length === 6
    }
    if (name === 'fein') {
      const digits = value.replace(/\D/g, '')
      isValid = digits.length === 9
    }

    setErrors(errs => ({ ...errs, [name]: isValid ? '' : 'err' }))
  }

  const handleFocus = () => {}

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const newErrors: Record<string, string> = {}
    const optionalFields = new Set(['tradeName', 'address2'])
    Object.entries(form).forEach(([key, value]) => {
      if (!value.trim() && !optionalFields.has(key)) {
        newErrors[key] = 'err'
      }
    })

    // Format validations
    const telDigits = form.telephone.replace(/\D/g, '')
    if (telDigits.length !== 10) newErrors.telephone = 'err'

    const zipDigits = form.zip.replace(/\D/g, '')
    if (zipDigits.length !== 5) newErrors.zip = 'err'

    const naicsDigits = form.naicsCode.replace(/\D/g, '')
    if (naicsDigits.length !== 6) newErrors.naicsCode = 'err'
    const feinDigits = form.fein.replace(/\D/g, '')
    if (feinDigits.length !== 9) newErrors.fein = 'err'
    setErrors(newErrors)
    setTouched(Object.fromEntries(Object.keys(form).map(k => [k, true])))

    if (Object.keys(newErrors).length > 0) return

    window.localStorage.setItem('clientRegistration', JSON.stringify(form))

    router.push('/clients/signup')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="max-w-2xl w-full mx-auto px-6">
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8">
          <div className="text-center mb-8">
            <div className="mx-auto h-12 mb-4 flex items-center justify-center">
              <Image
                priority={true}
                src="/logo.png"
                alt="Crossing Legal AI"
                className="object-contain"
                width={240}
                height={80}
              />
            </div>
          </div>
          <div className="text-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-1">Client Registration</h2>
          </div>
          <form className="space-y-4" onSubmit={handleSubmit} noValidate>
            <div className="flex gap-4">
              <TextField
                sequence={1}
                containerClassName="flex-1"
                name="clientName"
                label="Company Name"
                placeholder="Enter company name"
                value={form.clientName}
                required
                error={errors.clientName}
                isTouched={touched.clientName}
                onChange={v =>
                  handleChange({
                    target: { name: 'clientName', value: v },
                  } as unknown as React.ChangeEvent<HTMLInputElement>)
                }
                onBlur={v =>
                  handleBlur({
                    target: { name: 'clientName', value: v },
                  } as unknown as React.FocusEvent<HTMLInputElement>)
                }
              />
              <TextField
                sequence={2}
                containerClassName="flex-1"
                name="tradeName"
                label="Trade Name / DBA"
                placeholder="Enter trade name or DBA (if any)"
                value={form.tradeName}
                error={errors.tradeName}
                isTouched={touched.tradeName}
                onChange={v =>
                  handleChange({
                    target: { name: 'tradeName', value: v },
                  } as unknown as React.ChangeEvent<HTMLInputElement>)
                }
                onBlur={v =>
                  handleBlur({
                    target: { name: 'tradeName', value: v },
                  } as unknown as React.FocusEvent<HTMLInputElement>)
                }
              />
            </div>
            <div className="flex gap-4">
              <TextField
                sequence={3}
                containerClassName="flex-1"
                name="firstName"
                label="First Name"
                placeholder="Enter first name"
                value={form.firstName}
                required
                error={errors.firstName}
                isTouched={touched.firstName}
                onChange={v =>
                  handleChange({
                    target: { name: 'firstName', value: v },
                  } as unknown as React.ChangeEvent<HTMLInputElement>)
                }
                onBlur={v =>
                  handleBlur({
                    target: { name: 'firstName', value: v },
                  } as unknown as React.FocusEvent<HTMLInputElement>)
                }
              />
              <TextField
                sequence={4}
                containerClassName="flex-1"
                name="lastName"
                label="Last Name"
                placeholder="Enter last name"
                value={form.lastName}
                required
                error={errors.lastName}
                isTouched={touched.lastName}
                onChange={v =>
                  handleChange({
                    target: { name: 'lastName', value: v },
                  } as unknown as React.ChangeEvent<HTMLInputElement>)
                }
                onBlur={v =>
                  handleBlur({
                    target: { name: 'lastName', value: v },
                  } as unknown as React.FocusEvent<HTMLInputElement>)
                }
              />
            </div>

            <div className="flex gap-4">
              <TextField
                sequence={5}
                containerClassName="flex-1"
                name="address"
                label="Address"
                placeholder="Enter address"
                value={form.address}
                required
                error={errors.address}
                isTouched={touched.address}
                onChange={v =>
                  handleChange({
                    target: { name: 'address', value: v },
                  } as unknown as React.ChangeEvent<HTMLInputElement>)
                }
                onBlur={v =>
                  handleBlur({
                    target: { name: 'address', value: v },
                  } as unknown as React.FocusEvent<HTMLInputElement>)
                }
              />

              <TextField
                sequence={6}
                containerClassName="flex-1"
                name="address2"
                label="Address line 2"
                placeholder="Enter apartment, suite, unit, etc."
                value={form.address2}
                error={errors.address2}
                isTouched={touched.address2}
                onChange={v =>
                  handleChange({
                    target: { name: 'address2', value: v },
                  } as unknown as React.ChangeEvent<HTMLInputElement>)
                }
                onBlur={v =>
                  handleBlur({
                    target: { name: 'address2', value: v },
                  } as unknown as React.FocusEvent<HTMLInputElement>)
                }
              />
            </div>

            <div className="flex gap-4">
              <TextField
                sequence={7}
                containerClassName="flex-1"
                name="city"
                label="City"
                placeholder="Enter city"
                value={form.city}
                required
                error={errors.city}
                isTouched={touched.city}
                onChange={v =>
                  handleChange({
                    target: { name: 'city', value: v },
                  } as unknown as React.ChangeEvent<HTMLInputElement>)
                }
                onBlur={v =>
                  handleBlur({
                    target: { name: 'city', value: v },
                  } as unknown as React.FocusEvent<HTMLInputElement>)
                }
              />
              <div className="flex-1">
                <SelectOneField
                  sequence={8}
                  name="state"
                  label="State"
                  placeholder="Select a state"
                  value={form.state}
                  required
                  options={US_STATES.map(s => ({
                    value: `${s.code} - ${s.name}`,
                    label: `${s.code} - ${s.name}`,
                  }))}
                  onChange={v =>
                    handleChange({
                      target: { name: 'state', value: v },
                    } as unknown as React.ChangeEvent<HTMLInputElement>)
                  }
                  onBlur={v =>
                    handleBlur({
                      target: { name: 'state', value: v },
                    } as unknown as React.FocusEvent<HTMLInputElement>)
                  }
                />
              </div>
              <PatternTextField
                sequence={9}
                containerClassName="flex-1"
                id="zip"
                name="zip"
                label="ZIP"
                placeholder="12345"
                value={form.zip}
                error={errors.zip}
                isTouched={touched.zip}
                required
                format="#####"
                onChange={handleChange}
                onBlur={handleBlur}
                onFocus={handleFocus}
              />
            </div>

            <div className="flex gap-4">
              <PatternTextField
                sequence={10}
                containerClassName="flex-1"
                id="telephone"
                name="telephone"
                label="Telephone"
                placeholder="(555) 123-4567"
                value={form.telephone}
                error={errors.telephone}
                isTouched={touched.telephone}
                required
                format="(###) ###-####"
                onChange={handleChange}
                onBlur={handleBlur}
                onFocus={handleFocus}
              />
              <PatternTextField
                sequence={11}
                containerClassName="flex-1"
                id="naicsCode"
                name="naicsCode"
                label="NAICS Code"
                placeholder="e.g. 541611"
                value={form.naicsCode}
                error={errors.naicsCode}
                isTouched={touched.naicsCode}
                required
                format="######"
                onChange={handleChange}
                onBlur={handleBlur}
                onFocus={handleFocus}
              />
              <PatternTextField
                sequence={12}
                containerClassName="flex-1"
                id="fein"
                name="fein"
                label="FEIN"
                placeholder="XX-XXXXXXX"
                value={form.fein}
                error={errors.fein}
                isTouched={touched.fein}
                required
                onChange={handleChange}
                format="##-#######"
                onBlur={handleBlur}
                onFocus={handleFocus}
              />
            </div>

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-primary to-secondary hover:from-primary-600 hover:to-secondary-600 text-white font-medium py-2.5 px-4 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              style={{ marginTop: 32 }}
            >
              Register
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

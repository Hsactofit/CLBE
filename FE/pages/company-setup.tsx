'use client'

import { useState } from 'react'
import { Upload, Button, Input, Select, notification, Spin } from 'antd'
import type { UploadProps } from 'antd'
import { UploadOutlined, SettingOutlined, FileTextOutlined, MessageOutlined, LoadingOutlined, CheckCircleFilled } from '@ant-design/icons'
import AuthenticatedLayout from '@/layouts/authenticated'
import { useForm, Controller } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'

const { Dragger } = Upload
const { TextArea } = Input

// Document extraction API configuration - using main backend
const EXTRACTION_API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

// Extraction response types (camelCase from backend)
interface ContactPerson {
  firstName: string
  lastName: string
  title: string
}

interface BusinessAddress {
  address1: string
  address2: string
  city: string
  state: string
  postalCode: string
}

interface CompanySignatory {
  name: string
  title: string
  signatureDate: string
}

interface ExtractionResult {
  legalBusinessName: string
  tradeNameDba: string
  contactPerson: ContactPerson
  businessAddress: BusinessAddress
  telephoneNumber: string
  naicsCode: string
  federalEmployerIdentificationNumber: string
  companySignatories: CompanySignatory[]
  taxYear: string
  formType: string
}

// Response from the new API endpoint - returns ExtractionResult directly
type ExtractionResponse = ExtractionResult

// Form validation schema
const employerInfoSchema = yup.object().shape({
  legalBusinessName: yup.string().required('Legal business name is required'),
  tradeName: yup.string(),
  firstName: yup.string().required('First name is required'),
  lastName: yup.string().required('Last name is required'),
  title: yup.string().required('Title is required'),
  address1: yup.string().required('Address is required'),
  address2: yup.string(),
  city: yup.string().required('City is required'),
  state: yup.string().required('State is required'),
  postalCode: yup.string(),
  telephoneNumber: yup.string().required('Telephone number is required'),
  naicsCode: yup.string().required('NAICS code is required').min(4, 'At least 4 digits required'),
  companySignatories: yup.string(),
  fein: yup.string().required('FEIN is required'),
})

type EmployerInfoFormData = yup.InferType<typeof employerInfoSchema>

// Company documents checklist items
const CHECKLIST_ITEMS = [
  {
    id: 1,
    title: 'Recent tax filings',
    description: 'Latest corporate tax returns',
    required: true,
  },
  {
    id: 2,
    title: 'FEIN notice',
    description: 'Federal Employer Identification Number documentation',
    required: true,
  },
  {
    id: 3,
    title: 'Employee list',
    description: 'Current staff roster and employee information',
    required: true,
  },
  {
    id: 4,
    title: '501(c)(3) nonprofit certification',
    description: 'IRS determination letter',
    required: false,
  },
  {
    id: 5,
    title: 'Company brochure or flyer',
    description: 'Marketing materials describing your organization',
    required: false,
  },
  {
    id: 6,
    title: 'Immigration policy',
    description: 'Corporate immigration and regulatory policies',
    required: false,
  },
  {
    id: 7,
    title: 'Hiring policy',
    description: 'Employee recruitment and hiring procedures',
    required: false,
  },
]

export default function CompanySetupPage() {
  const [api, contextHolder] = notification.useNotification()
  const [uploadedFiles, setUploadedFiles] = useState<any[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [extractedData, setExtractedData] = useState<ExtractionResult | null>(null)
  const [hasTaxReturnUploaded, setHasTaxReturnUploaded] = useState(false)

  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<EmployerInfoFormData>({
    resolver: yupResolver(employerInfoSchema),
    mode: 'onBlur',
  })

  // Function to populate form with extracted data
  const populateFormWithExtractedData = (data: ExtractionResult) => {
    setValue('legalBusinessName', data.legalBusinessName || '')
    setValue('tradeName', data.tradeNameDba || '')
    setValue('firstName', data.contactPerson?.firstName || '')
    setValue('lastName', data.contactPerson?.lastName || '')
    setValue('title', data.contactPerson?.title || '')
    setValue('address1', data.businessAddress?.address1 || '')
    setValue('address2', data.businessAddress?.address2 || '')
    setValue('city', data.businessAddress?.city || '')
    setValue('state', data.businessAddress?.state || '')
    setValue('postalCode', data.businessAddress?.postalCode || '')
    setValue('telephoneNumber', data.telephoneNumber || '')
    setValue('naicsCode', data.naicsCode || '')
    setValue('fein', data.federalEmployerIdentificationNumber || '')
  }

  const uploadProps: UploadProps = {
    name: 'file',
    multiple: false,
    accept: '.pdf',
    beforeUpload: (file) => {
      const isValidType = file.type === 'application/pdf'
      if (!isValidType) {
        api.error({
          message: 'Invalid file type',
          description: 'Only PDF files are supported for extraction',
        })
        return false
      }
      const isLt10M = file.size / 1024 / 1024 < 10
      if (!isLt10M) {
        api.error({
          message: 'File too large',
          description: 'File must be smaller than 10MB',
        })
        return false
      }
      return true
    },
    customRequest: async (options) => {
      const file = options.file as File
      setIsUploading(true)

      try {
        // Create FormData for the extraction API
        const formData = new FormData()
        formData.append('file', file)
        formData.append('document_type', 'corporate_tax_returns')

        console.log('Calling extraction API:', `${EXTRACTION_API_URL}/documents/extract`)

        // Call the extraction API
        const response = await fetch(`${EXTRACTION_API_URL}/documents/extract`, {
          method: 'POST',
          body: formData,
        })

        console.log('Response status:', response.status)

        if (!response.ok) {
          const errorText = await response.text()
          console.error('API error response:', errorText)
          throw new Error(`API request failed with status ${response.status}: ${errorText}`)
        }

        const result: ExtractionResponse = await response.json()
        console.log('Extraction result:', result)

        // Store extracted data
        setExtractedData(result)

        // Auto-populate form with extracted data
        populateFormWithExtractedData(result)

        // Add file to uploaded files list
        setUploadedFiles(prev => [...prev, file])

        // Mark tax return as uploaded in checklist
        setHasTaxReturnUploaded(true)

        api.success({
          message: 'Document processed successfully',
          description: `${file.name} has been uploaded and employer information has been extracted`,
          duration: 5,
        })
      } catch (error) {
        console.error('Extraction error:', error)

        // Check if it's a network/CORS error
        const errorMessage = error instanceof TypeError && error.message.includes('fetch')
          ? 'Cannot connect to extraction API. Please ensure the API server is running on port 8001 and CORS is enabled.'
          : error instanceof Error
            ? error.message
            : 'Failed to extract employer information from document'

        api.error({
          message: 'Extraction failed',
          description: errorMessage,
          duration: 8,
        })
      } finally {
        setIsUploading(false)
      }
    },
    showUploadList: false,
  }

  const onSubmit = async (data: EmployerInfoFormData) => {
    console.log('Form submitted:', data)
    api.success({
      message: 'Employer Information Saved',
      description: 'Your employer information has been saved successfully.',
    })
  }

  return (
    <AuthenticatedLayout>
      {contextHolder}
      <div className="max-w-full">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Company Setup</h1>
              <p className="text-gray-600">Upload and manage your company documents</p>
            </div>
            <Button
              type="primary"
              icon={<MessageOutlined />}
              size="large"
              className="bg-[#5488CE] hover:bg-[#4377bd] h-auto px-6 py-3"
            >
              Chat with Documents
            </Button>
          </div>

          {/* Upload Documents Section */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-5">
            <h2 className="text-xl font-bold text-gray-900 mb-2">Upload Corporate Tax Returns</h2>
            <p className="text-gray-600 mb-5">
              Upload your corporate tax return (PDF) to automatically extract and populate employer information below.
            </p>

            <Spin spinning={isUploading} indicator={<LoadingOutlined style={{ fontSize: 24 }} spin />}>
              <div className="border-2 border-dashed border-blue-300 rounded-lg py-8 px-8 text-center bg-white hover:border-[#5488CE] transition-colors">
                <div className="flex flex-col items-center justify-center">
                  <UploadOutlined className="text-3xl text-gray-400 mb-2" />
                  <p className="text-base font-medium text-gray-900 mb-1">
                    {isUploading ? 'Processing document...' : 'Drop corporate tax return here or click to upload'}
                  </p>
                  <p className="text-sm text-gray-500 mb-3">
                    Supports PDF files up to 10MB
                  </p>
                  <Upload {...uploadProps} disabled={isUploading}>
                    <Button
                      className="bg-white border border-gray-300 text-gray-900 hover:bg-gray-50 hover:border-gray-400 h-9 px-4"
                      disabled={isUploading}
                    >
                      {isUploading ? 'Processing...' : 'Choose File'}
                    </Button>
                  </Upload>
                </div>
              </div>
            </Spin>

            {extractedData && (
              <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm font-medium text-green-800">
                  ✓ Employer information extracted successfully from {extractedData.formType} (Tax Year {extractedData.taxYear})
                </p>
                <p className="text-xs text-green-700 mt-1">
                  Form fields have been auto-populated below. Please review and edit as needed.
                </p>
              </div>
            )}
          </div>

          {/* Company Documents Checklist */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-5">
            <h2 className="text-xl font-bold text-gray-900 mb-5">Company Documents Checklist</h2>

            <div className="space-y-0">
              {CHECKLIST_ITEMS.map((item) => {
                const isSubmitted = item.id === 1 && hasTaxReturnUploaded
                return (
                  <div
                    key={item.id}
                    className={`flex items-center justify-between py-4 border-b border-gray-100 last:border-b-0 ${
                      isSubmitted ? 'bg-green-50' : 'bg-white'
                    }`}
                  >
                    <div className="flex items-center space-x-4 flex-1">
                      {isSubmitted ? (
                        <CheckCircleFilled className="text-2xl text-green-600 flex-shrink-0" />
                      ) : (
                        <div className="w-6 h-6 rounded-full border-2 border-gray-300 flex-shrink-0 bg-white"></div>
                      )}
                      <div className="flex-1">
                        <h3 className="text-base font-semibold text-gray-900 mb-0.5">{item.title}</h3>
                        <p className="text-sm text-gray-500">{item.description}</p>
                      </div>
                    </div>
                    {isSubmitted ? (
                      <span className="px-3 py-1 text-sm font-medium text-white bg-[#4746A5] rounded ml-4 flex-shrink-0">
                        Submitted
                      </span>
                    ) : (
                      <span className={`px-3 py-1 text-sm font-medium ${item.required ? 'text-gray-900' : 'text-gray-600'} bg-white border border-gray-300 rounded ml-4 flex-shrink-0`}>
                        {item.required ? 'Required' : 'Optional'}
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Employer Information Form */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-5">
            <div className="flex items-center mb-2">
              <FileTextOutlined className="text-xl mr-2" />
              <h2 className="text-xl font-semibold text-gray-900">Employer Information</h2>
            </div>
            <p className="text-gray-600 mb-8">
              Complete employer details that will be used for all immigration applications. This information will auto-populate relevant forms.
            </p>

            <form onSubmit={handleSubmit(onSubmit)}>
              {/* Legal Business Name & Trade Name */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Legal Business Name <span className="text-red-500">*</span>
                  </label>
                  <Controller
                    name="legalBusinessName"
                    control={control}
                    render={({ field }) => (
                      <Input
                        {...field}
                        placeholder="Enter legal business name"
                        status={errors.legalBusinessName ? 'error' : ''}
                        className="h-11"
                        suffix={<i className="fas fa-keyboard text-gray-400"></i>}
                      />
                    )}
                  />
                  {errors.legalBusinessName && (
                    <p className="text-red-500 text-xs mt-1">{errors.legalBusinessName.message}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Trade Name/DBA (if applicable)
                  </label>
                  <Controller
                    name="tradeName"
                    control={control}
                    render={({ field }) => (
                      <Input {...field} placeholder="Enter trade name or DBA" className="h-11" />
                    )}
                  />
                </div>
              </div>

              {/* First Name, Last Name, Title */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    First Name <span className="text-red-500">*</span>
                  </label>
                  <Controller
                    name="firstName"
                    control={control}
                    render={({ field }) => (
                      <Input
                        {...field}
                        placeholder="Enter first name"
                        status={errors.firstName ? 'error' : ''}
                        className="h-11"
                      />
                    )}
                  />
                  {errors.firstName && (
                    <p className="text-red-500 text-xs mt-1">{errors.firstName.message}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Last Name <span className="text-red-500">*</span>
                  </label>
                  <Controller
                    name="lastName"
                    control={control}
                    render={({ field }) => (
                      <Input
                        {...field}
                        placeholder="Enter last name"
                        status={errors.lastName ? 'error' : ''}
                        className="h-11"
                      />
                    )}
                  />
                  {errors.lastName && (
                    <p className="text-red-500 text-xs mt-1">{errors.lastName.message}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Title <span className="text-red-500">*</span>
                  </label>
                  <Controller
                    name="title"
                    control={control}
                    render={({ field }) => (
                      <Input
                        {...field}
                        placeholder="Enter job title"
                        status={errors.title ? 'error' : ''}
                        className="h-11"
                      />
                    )}
                  />
                  {errors.title && (
                    <p className="text-red-500 text-xs mt-1">{errors.title.message}</p>
                  )}
                </div>
              </div>

              {/* Address 1 & Address 2 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Address 1 <span className="text-red-500">*</span>
                  </label>
                  <Controller
                    name="address1"
                    control={control}
                    render={({ field }) => (
                      <Input
                        {...field}
                        placeholder="Enter street address"
                        status={errors.address1 ? 'error' : ''}
                        className="h-11"
                      />
                    )}
                  />
                  {errors.address1 && (
                    <p className="text-red-500 text-xs mt-1">{errors.address1.message}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Address 2
                  </label>
                  <Controller
                    name="address2"
                    control={control}
                    render={({ field }) => (
                      <Input {...field} placeholder="Enter suite, floor, etc. (optional)" className="h-11" />
                    )}
                  />
                </div>
              </div>

              {/* City, State, Postal Code */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    City <span className="text-red-500">*</span>
                  </label>
                  <Controller
                    name="city"
                    control={control}
                    render={({ field }) => (
                      <Input
                        {...field}
                        placeholder="Enter city"
                        status={errors.city ? 'error' : ''}
                        className="h-11"
                      />
                    )}
                  />
                  {errors.city && (
                    <p className="text-red-500 text-xs mt-1">{errors.city.message}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    State <span className="text-red-500">*</span>
                  </label>
                  <Controller
                    name="state"
                    control={control}
                    render={({ field }) => (
                      <Input
                        {...field}
                        placeholder="Enter state"
                        status={errors.state ? 'error' : ''}
                        className="h-11"
                      />
                    )}
                  />
                  {errors.state && (
                    <p className="text-red-500 text-xs mt-1">{errors.state.message}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Postal Code
                  </label>
                  <Controller
                    name="postalCode"
                    control={control}
                    render={({ field }) => (
                      <Input {...field} placeholder="Enter postal code" className="h-11" />
                    )}
                  />
                </div>
              </div>

              {/* Telephone Number & NAICS Code */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Telephone Number <span className="text-red-500">*</span>
                  </label>
                  <Controller
                    name="telephoneNumber"
                    control={control}
                    render={({ field }) => (
                      <Input
                        {...field}
                        placeholder="Enter phone number"
                        status={errors.telephoneNumber ? 'error' : ''}
                        className="h-11"
                      />
                    )}
                  />
                  {errors.telephoneNumber && (
                    <p className="text-red-500 text-xs mt-1">{errors.telephoneNumber.message}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    NAICS Code (at least 4 digits)
                  </label>
                  <Controller
                    name="naicsCode"
                    control={control}
                    render={({ field }) => (
                      <Input
                        {...field}
                        placeholder="e.g., 541511"
                        status={errors.naicsCode ? 'error' : ''}
                        className="h-11"
                      />
                    )}
                  />
                  {errors.naicsCode && (
                    <p className="text-red-500 text-xs mt-1">{errors.naicsCode.message}</p>
                  )}
                </div>
              </div>

              {/* Company Signatories & FEIN */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Company Signatories
                  </label>
                  <Controller
                    name="companySignatories"
                    control={control}
                    render={({ field }) => (
                      <Select
                        {...field}
                        placeholder="Select a signatory"
                        className="w-full"
                        size="large"
                        options={[
                          { value: 'ceo', label: 'CEO' },
                          { value: 'cfo', label: 'CFO' },
                          { value: 'hr', label: 'HR Director' },
                        ]}
                      />
                    )}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Federal Employer Identification Number (FEIN) <span className="text-red-500">*</span>
                  </label>
                  <Controller
                    name="fein"
                    control={control}
                    render={({ field }) => (
                      <Input
                        {...field}
                        placeholder="XX-XXXXXXX"
                        status={errors.fein ? 'error' : ''}
                        className="h-11"
                      />
                    )}
                  />
                  {errors.fein && (
                    <p className="text-red-500 text-xs mt-1">{errors.fein.message}</p>
                  )}
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end">
                <Button
                  type="primary"
                  htmlType="submit"
                  icon={<SettingOutlined />}
                  size="large"
                  className="bg-[#5488CE] hover:bg-[#4377bd] h-auto px-6 py-3"
                >
                  Save Employer Information
                </Button>
              </div>
            </form>
          </div>

          {/* Your Documents Section */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-5">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Your Documents ({uploadedFiles.length})
            </h2>
            <p className="text-gray-600">Manage your uploaded company documents</p>
          </div>

          {/* How it works Section */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center mb-3">
              <SettingOutlined className="text-lg mr-2 text-gray-600" />
              <h3 className="text-base font-semibold text-gray-900">How it works</h3>
            </div>
            <p className="text-sm text-gray-600">
              Upload your documents and use the "Chat with Documents" button to ask questions. Our AI will analyze your documents and provide answers based on their content using advanced RAG (Retrieval-Augmented Generation) technology.
            </p>
          </div>
        </div>
    </AuthenticatedLayout>
  )
}

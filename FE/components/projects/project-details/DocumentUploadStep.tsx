'use client'

import React, { useState } from 'react'
import { useEffect } from 'react'
import AuthenticatedLayout from '@/layouts/authenticated'
import { Upload, Typography, notification, Progress } from 'antd'
import type { UploadProps } from 'antd'
import 'antd/dist/reset.css'
import UploadedDocuments from '@/components/UploadedDocuments'
import { useRouter } from 'next/router'

import { useAuthFetch } from '@/hooks/useAuthFetch'
import { ProjectDocument } from '@/types/project'
import { DocumentType } from '@/lib/interfaces'
import { SubTitle, Title } from '@/components/Typography'

const { Dragger } = Upload
const { Text } = Typography

interface DocumentUploadStepProps {
  onStepCompleted?: () => void
}

export const DocumentUploadStep: React.FC<DocumentUploadStepProps> = ({ onStepCompleted }) => {
  const router = useRouter()
  const authFetch = useAuthFetch()
  const [projectId, setProjectId] = useState<string>(router.query.id as string)
  const [documents, setDocuments] = useState<ProjectDocument[]>([])
  const [documentTypes, setDocumentTypes] = useState<DocumentType[]>([])
  const [isUploading, setIsUploading] = useState<Date | null>(null)
  const [uploadProgress, setUploadProgress] = useState<number>(0)
  const [api, contextHolder] = notification.useNotification()
  const [isProcessing, setIsProcessing] = useState(false)

  const validateRequiredDocuments = () => {
    // Check if all required document types have been uploaded
    const requiredTypes = documentTypes.filter((type: DocumentType) => type.required)

    const missingTypes = requiredTypes.filter((requiredType: DocumentType) => {
      // Check if any document matches this required type
      const hasMatchingDocument = documents.some(doc => {
        // Try multiple ways to match since the API structure might vary
        return doc.inferredType?.code === requiredType.code
      })
      return !hasMatchingDocument
    })

    if (missingTypes.length > 0) {
      const missingTypeNames = missingTypes.map((type: DocumentType) => type.name).join(', ')
      api.error({
        message: 'Missing Required Documents',
        description: `Please upload the following required documents: ${missingTypeNames}`,
        duration: 5,
      })
      return false
    }

    return true
  }

  const handleNext = async () => {
    if (!validateRequiredDocuments()) {
      return
    }

    setIsProcessing(true)

    try {
      // Call the backend to get steps (this will refresh the workflow)
      const response = await authFetch(`/projects/${projectId}/steps`)

      if (response.ok) {
        // Refresh the progress tracker to show updated progress
        if (onStepCompleted) {
          onStepCompleted()
        }
      } else {
        console.error('Failed to refresh workflow steps:', response.status)
        api.error({
          message: 'Failed to proceed',
          description: 'There was an issue proceeding to the next step. Please try again.',
          duration: 3,
        })
      }
    } catch (error) {
      console.error('Error proceeding to next step:', error)
      api.error({
        message: 'Error',
        description: 'An error occurred while proceeding to the next step.',
        duration: 3,
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const getDocumentTypes = async () => {
    try {
      const response = await authFetch(`/projects/${projectId}/documents/types`)
      if (response.ok) {
        const data = await response.json()
        setDocumentTypes(data.types || [])
      } else {
        console.error('Failed to load documents:', response.status)
        api.error({
          message: 'Fetching documents failed',
          description:
            response.text() || 'There was an issue loading your document. Please try again.',
          duration: 0,
        })
      }
    } catch (error) {
      console.error('Error fetching project details:', error)
      api.error({
        message: 'Fetching documents failed',
        description: `${error}` || 'There was an issue loading your document. Please try again.',
        duration: 0,
      })
    }
  }

  const getDocuments = async () => {
    try {
      const response = await authFetch(`/projects/${projectId}/documents`)
      if (response.ok) {
        const data = await response.json()
        setDocuments(data.documents || [])
      } else {
        console.error('Failed to load documents:', response.status)
        api.error({
          message: 'Fetching documents failed',
          description:
            response.text() || 'There was an issue loading your document. Please try again.',
          duration: 0,
        })
      }
    } catch (error) {
      console.error('Error fetching project details:', error)
      api.error({
        message: 'Fetching documents failed',
        description: `${error}` || 'There was an issue loading your document. Please try again.',
        duration: 0,
      })
    }
  }

  useEffect(() => {
    if (isUploading) {
      const interval = setInterval(() => {
        const total = 5000 // Simulated total upload size
        const uploaded = new Date().getTime() - isUploading.getTime()
        setUploadProgress(Math.ceil((uploaded / total) * 100))
      }, 100)

      return () => clearInterval(interval)
    } else {
      setUploadProgress(0)
    }
  }, [isUploading])

  useEffect(() => {
    setProjectId(router.query.id as string)
  }, [router.query.id])

  const uploadProps: UploadProps = {
    name: 'file',
    multiple: true,
    accept: `image/*,.doc,.docx,.pdf`,
    async customRequest(info) {
      const file = info.file as File
      if (!file) return

      const fileSizeInBytes = file?.size || 0
      const fileSizeInMB = fileSizeInBytes / (1024 * 1024)

      if (fileSizeInMB > 30) {
        api.error({
          message: 'Document size is beyond 30MB.',
          description: 'Please upload small size document.',
          duration: 2,
        })
        return
      }

      const formData = new FormData()
      formData.append('file', info.file as File)
      setIsUploading(new Date())
      api.success({
        message: 'Uploading Document...',
        description: 'Your document is being uploaded.',
        duration: 4,
      })
      await authFetch(`/projects/${projectId}/documents`, { body: formData, method: 'POST' })
        .then(() => {
          api.success({
            message: 'Document Uploaded Successfully',
            description: 'Your document has been uploaded successfully.',
            duration: 2,
          })
          setIsUploading(null)
          getDocuments()
        })
        .catch(error => {
          console.error('Error uploading document:', error)
          setIsUploading(null)
          api.error({
            message: 'Document Upload Failed',
            description: error || 'There was an issue uploading your document. Please try again.',
            duration: 3,
          })
        })
    },
    onDrop(e) {
      console.log('Dropped files', e.dataTransfer.files)
    },
    capture: undefined,
    showUploadList: false,
  }

  useEffect(() => {
    if (projectId) {
      getDocuments()
      getDocumentTypes()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId])

  return (
    <>
      {contextHolder}
      <div className="flex flex-col items-center justify-normal w-full min-[200px] mt-5 mb-5">
        <Dragger
          {...uploadProps}
          className={`${isUploading ? 'w-full' : 'w-full'} min-[200px] h-full`}
        >
          <p className="ant-typography ant-upload-drag-icon" style={{ color: 'red' }}>
            {/* <UploadOutlined /> */}
          </p>
          <p className="ant-typography ant-upload-text">Drag and drop a file, or click to upload</p>
          <p className="ant-typography ant-upload-hint">
            Crossing will automatically categorize your document for you and extract relevant
            information.
          </p>
        </Dragger>
        {isUploading && (
          <Progress
            className="mt-10"
            success={{ percent: uploadProgress < 30 ? uploadProgress : 30 }}
            percent={uploadProgress}
            format={() => `${uploadProgress > 30 ? 'Processing...' : 'Uploading...'}`}
            percentPosition={{ align: 'center', type: 'outer' }}
          />
        )}
      </div>
      <UploadedDocuments types={documentTypes} documents={documents} />

      {/* Next Button */}
      <div className="flex justify-end mt-8 pt-6 border-t border-gray-200">
        <button
          onClick={handleNext}
          disabled={isProcessing || isUploading != null}
          className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-r from-primary to-secondary hover:from-primary-600 hover:to-secondary-600 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200"
          style={{ minWidth: 150 }}
        >
          {isProcessing ? (
            <>
              <div className="w-4 h-4 border-2 border-transparent border-t-white rounded-full animate-spin mr-2" />
              Processing...
            </>
          ) : (
            <>
              <i className="fas fa-arrow-right w-4 h-4 mr-2"></i>
              Next
            </>
          )}
        </button>
      </div>
    </>
  )
}

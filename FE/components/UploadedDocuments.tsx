'use client'

import * as React from 'react'
import { CheckCircleOutlined } from '@ant-design/icons'
import { Badge, Typography } from 'antd'
import { ProjectDocument } from '@/types/project'
import { ShimmerLoader } from '@/components/ShimmerLoader'
import { useEffect } from 'react'
import { DocumentType } from '@/lib/interfaces'

const { Text } = Typography

interface LocalDocumentType extends DocumentType {
  isDocumentUploaded?: boolean
}
interface UploadedDocumentsProps {
  types: LocalDocumentType[]
  documents: ProjectDocument[]
}

const UploadedDocuments: React.FC<UploadedDocumentsProps> = ({ types, documents }) => {
  const [updatedTypes, setUpdatedTypes] = React.useState<LocalDocumentType[]>([])

  const isDocumentUploaded = (type: DocumentType): boolean => {
    return documents.some(doc => doc.inferredType?.code === type.code)
  }

  useEffect(() => {
    const updated = types.map((type: DocumentType) => {
      const isUploaded: boolean = isDocumentUploaded(type)
      return { ...type, isDocumentUploaded: isUploaded }
    })
    setUpdatedTypes(updated)
  }, [types, documents])

  return (
    <>
      <div className="">
        {updatedTypes.length === 0 && <ShimmerLoader lines={3} items={5} />}
        {updatedTypes.map(type => (
          <div key={type.publicId} className={`flex flex-row w-full p-2 `}>
            <div
              className={`${type?.isDocumentUploaded ? 'bg-green-100' : 'bg-white-100'} rounded-lg shadow p-4 w-full`}
            >
              <div className="flex w-full items-center mr-4">
                <span
                  className={`w-2 flex-initial text-2xl ${type?.isDocumentUploaded ? 'text-green-500' : 'text-gray-500'} mr-2`}
                >
                  <CheckCircleOutlined />
                </span>

                <div className="flex-auto ml-6 ">
                  <div className="flex flex-col ">
                    <span className="font-semibold mr-2">{type.name}</span>
                    <Text type="secondary">{type.description}</Text>
                  </div>
                </div>
                <div className="flex-shrink-0">
                  {type.isDocumentUploaded ? (
                    <span className="px-3 py-1 bg-green-100 text-green-800 border border-green-400 text-sm font-medium rounded-full">
                      Submitted
                    </span>
                  ) : (
                    <span className="px-3 py-1 bg-gray-100 text-gray-800 border border-gray-400 text-sm font-medium rounded-full">
                      {type.required ? 'Required' : 'Optional'}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  )
}

export default UploadedDocuments

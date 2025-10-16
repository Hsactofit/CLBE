import { InferredType } from "@/lib/interfaces"

export interface Project {
  publicId?: string
  beneficiaryFirstName: string
  beneficiaryLastName: string
  positionTitle: string
  typeId: string
  type: InferredType | null;
  filingType: string
  deadline: string
  priority: string
  premiumProcessing: boolean
  notes: string
  completed?: boolean
  startedAt?: Date | undefined 
}

export interface ProjectDocument {
  publicId: string
  createdAt: string
  updatedAt: string
  name: string
  contentType: string
  inferredTypeId: string | null
  extractedData: any
  inferredType: any
}

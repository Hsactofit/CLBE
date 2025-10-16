export interface InferredType {
  publicId: string
  code: string
  name: string
  description: string
}

export interface DocumentType {
  id: string
  publicId: string
  code: string
  name: string
  description: string
  required: boolean
}

export interface ProjectWorkflowChildStep {
  id: number
  name: string
  description: string | null
  key: string | null
  isActiveStep: boolean
  icon: string | null
  sequence: number
  startedAt: string | null
  completedAt: Date | null
  childSteps: ProjectWorkflowChildStep[] | null
}

export interface ProjectWorkflowStep {
  id: number
  name: string
  description: string
  key: string
  isActiveStep: boolean
  icon: string
  sequence: number
  startedAt: string | null
  completedAt: string | null
  childSteps: ProjectWorkflowChildStep[]
}

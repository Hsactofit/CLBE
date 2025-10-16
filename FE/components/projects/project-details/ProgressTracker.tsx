'use client'

import { ProjectProgressStatus } from '@/lib/enums'
import { ProjectProgressStep } from './ProjectProgressStep'
import { Project } from '@/types/project'
import { useAuthFetch } from '@/hooks/useAuthFetch'
import { useEffect, useState } from 'react'
import { Divider, Empty, notification } from 'antd'
import { SubStepDetails } from './SubStepDetails'
import { ProjectWorkflowStep } from '@/lib/interfaces'
import { DocumentUploadStep } from '@/components/projects/project-details/DocumentUploadStep'
import { ProjectForms } from '@/components/projects/project-details/form-filling'
import { FormCompletionStep } from '@/components/projects/project-details/FormCompletionStep'
import WageDeterminationStep from '@/components/projects/project-details/WageDeterminationStep'
import { LaborCertificationStep } from '@/components/projects/project-details/LaborCertificationStep'
import * as LucideIcons from 'lucide-react'

interface ProgressTrackerProps {
  project: Project
}

export const ProgressTracker = ({ project }: ProgressTrackerProps) => {
  const authFetch = useAuthFetch()
  const [toastNotification, contextHolder] = notification.useNotification()
  const [steps, setSteps] = useState<ProjectWorkflowStep[]>([])
  const [isStepsLoading, setIsStepsLoading] = useState(false)
  const [activeWorkflowStep, setActiveWorkflowStep] = useState<ProjectWorkflowStep | null>(null)
  const [hoveredStep, setHoveredStep] = useState<ProjectWorkflowStep | null>(null)
  const [clickedStep, setClickedStep] = useState<ProjectWorkflowStep | null>(null)
  const [showSubSteps, setShowSubSteps] = useState<boolean>(false)

  const loadSteps = async () => {
    setIsStepsLoading(true)
    const response = await authFetch(`/projects/${project?.publicId}/steps`)

    if (response.ok) {
      const steps: { steps: ProjectWorkflowStep[] } = await response.json()
      // Sort steps by sequence before setting them
      const sortedSteps = steps?.steps?.sort((a, b) => (a.sequence || 0) - (b.sequence || 0)) || []
      setSteps(sortedSteps)

      if (sortedSteps.length > 0) {
        let activeStepIndex = -1
        let lastCompletedIndex = -1

        // Find the active step and last completed step
        sortedSteps.forEach((item, index) => {
          // Check if this step is active OR has any active child steps
          const hasActiveChildSteps =
            item.childSteps && item.childSteps.some(child => child.isActiveStep)

          if (item.isActiveStep || hasActiveChildSteps) {
            activeStepIndex = index
          }
          if (item.completedAt) {
            lastCompletedIndex = index
          }
        })

        // Priority: Active step > Last completed step > First step
        let selectedIndex = 0
        if (activeStepIndex >= 0) {
          selectedIndex = activeStepIndex
        } else if (lastCompletedIndex >= 0) {
          selectedIndex = lastCompletedIndex
        }

        setActiveWorkflowStep(sortedSteps[selectedIndex])
      }
      setIsStepsLoading(false)
      toastNotification.info({ message: 'Workflow steps loaded.', duration: 3 })
    } else if (response.status === 404) {
      toastNotification.error({ message: 'Unable to lad steps', duration: 3 })
      setIsStepsLoading(false)
    }
  }

  const onStepHover = (stepIndex: number) => {
    let step = steps[stepIndex]
    setHoveredStep(step)
    setShowSubSteps(true)
  }

  const onStepLeave = () => {
    // Only hide substeps if no step is clicked (pinned)
    if (!clickedStep) {
      setHoveredStep(null)
      setShowSubSteps(false)
    } else {
      // Clear hover state but keep substeps visible for clicked step
      setHoveredStep(null)
    }
  }

  const onStepSelect = (stepIndex: number) => {
    let step = steps[stepIndex]

    // Check if step is Complete or Active (has active child steps)
    const hasActiveChildSteps = step.childSteps && step.childSteps.some(child => child.isActiveStep)
    const isStepAccessible = step.completedAt || step.isActiveStep || hasActiveChildSteps

    // If clicking the same step that's already clicked, unpin it
    if (clickedStep && clickedStep.key === step.key) {
      setClickedStep(null)
      setShowSubSteps(false)
    } else {
      // Pin this step and show its substeps
      setClickedStep(step)
      setShowSubSteps(true)

      // Only change workflow content if step is Complete or Active
      if (isStepAccessible) {
        setActiveWorkflowStep(step)
      }
    }
  }

  const getProjectStatus = (
    isActiveStep: boolean,
    completedAt: Date | null,
    childSteps?: any[]
  ) => {
    if (completedAt) {
      return ProjectProgressStatus.Completed
    }

    // Check if any child steps are active (started but not completed)
    const hasActiveChildSteps = childSteps && childSteps.some(child => child.isActiveStep)

    return isActiveStep || hasActiveChildSteps
      ? ProjectProgressStatus.Active
      : ProjectProgressStatus.Pending
  }
  const getIcon = (
    name: keyof typeof LucideIcons,
    isActiveStep: boolean,
    completedAt: Date | null,
    childSteps?: any[]
  ) => {
    const IconComponent = LucideIcons[name] as any
    const status = getProjectStatus(isActiveStep, completedAt, childSteps)
    const size = 25
    const colors = {
      [ProjectProgressStatus.Completed]: `green`,
      [ProjectProgressStatus.Active]: `blue`,
      [ProjectProgressStatus.Pending]: `gray`,
    }
    const color = colors[status]

    if (!IconComponent) {
      return <LucideIcons.Settings />
    }

    return <IconComponent size={size} color={color} />
  }

  const stepFormComponents: any = {
    H1B_DOCUMENT_GATHERING: <DocumentUploadStep onStepCompleted={loadSteps} />,
    H1B_INFORMATION_COLLECTION: (
      <FormCompletionStep projectId={project?.publicId || ''} onStepCompleted={loadSteps} />
    ),
    H1B_WAGE_DETERMINATION: (
      <WageDeterminationStep projectId={project?.publicId || ''} onStepCompleted={loadSteps} />
    ),
    H1B_DOL_LABOR_CERTIFICATION: (
      <LaborCertificationStep projectId={project?.publicId || ''} onStepCompleted={loadSteps} />
    ),
    H1B_PETITION_PREPARATION: null,
    H1B_USCIS_SUBMISSION: null,
  }

  useEffect(() => {
    loadSteps()
  }, [project])

  return (
    <>
      <div className="max-h-40 overflow-y-scroll hidden">
        <pre>{JSON.stringify(activeWorkflowStep, null, 2)}</pre>
      </div>
      <div className="rounded-lg border bg-card text-card-foreground shadow-sm overflow-scroll">
        <div className="p-6 pt-6 overflow-scroll">
          <div className="space-y-4 overflow-scroll">
            <div
              className="flex items-center justify-center overflow-scroll"
              style={{ height: '200px' }}
            >
              <div className="flex items-center justify-center overflow-scroll gap-8">
                {!isStepsLoading && Array.isArray(steps) && steps.length === 0 && (
                  <Empty description={'Project steps not available'} />
                )}

                {!isStepsLoading &&
                  steps?.map((item: any, index: number) => {
                    return (
                      <div
                        key={item.key}
                        onMouseEnter={() => onStepHover(index)}
                        onMouseLeave={onStepLeave}
                      >
                        <ProjectProgressStep
                          onStepSelect={onStepSelect}
                          title={item.name}
                          status={getProjectStatus(
                            item.isActiveStep,
                            item.completedAt,
                            item.childSteps
                          )}
                          totalSteps={steps.length}
                          stepIndex={index}
                          icon={getIcon(
                            item.icon,
                            item.isActiveStep,
                            item.completedAt,
                            item.childSteps
                          )}
                          childSteps={item.childSteps}
                          completedAt={item.completedAt}
                        />
                      </div>
                    )
                  })}
              </div>
            </div>

            {showSubSteps &&
              (() => {
                // Show clicked step if available, otherwise show hovered step
                const displayStep = clickedStep || hoveredStep

                if (!displayStep) return null

                if (Array.isArray(displayStep.childSteps) && displayStep.childSteps.length == 0) {
                  return <Divider />
                }

                if (Array.isArray(displayStep.childSteps) && displayStep.childSteps.length > 0) {
                  return (
                    <SubStepDetails
                      selectedStepIndex={steps.findIndex(s => s.key === displayStep.key) + 1}
                      onClose={() => {
                        setClickedStep(null)
                        setShowSubSteps(false)
                      }}
                      {...displayStep}
                    />
                  )
                }

                return null
              })()}

            {activeWorkflowStep && stepFormComponents[activeWorkflowStep.key]}
            <div className="transition-all duration-300 ease-out overflow-hidden max-h-0 opacity-0"></div>
          </div>
        </div>
      </div>
    </>
  )
}

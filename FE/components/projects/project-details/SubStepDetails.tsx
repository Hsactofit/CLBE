'use client'

import { ProjectWorkflowChildStep, ProjectWorkflowStep } from '@/lib/interfaces'
import { useEffect, useState } from 'react'
import { Clock, Check } from 'lucide-react'

const getStepIcon = (
  isActiveStep: boolean,
  completedAt: Date | string | null,
  startedAt: string | null
) => {
  // If completed: white checkmark in green circle
  if (completedAt) {
    return (
      <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
        <Check className="w-4 h-4 text-white" />
      </div>
    )
  }

  // If active or started but not completed: clock icon in blue circle
  if (isActiveStep || (startedAt && !completedAt)) {
    return (
      <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center">
        <Clock className="w-4 h-4 text-white" />
      </div>
    )
  }

  // Default pending state: gray target
  return (
    <div className="w-6 h-6 rounded-full border-2 border-gray-300 bg-white flex items-center justify-center">
      <div className="w-2 h-2 rounded-full bg-gray-300"></div>
    </div>
  )
}

export const SubStepDetails = (
  workflowStep: ProjectWorkflowStep & { selectedStepIndex: number; onClose?: () => void }
) => {
  const [completedSteps, setCompletedSteps] = useState(0)

  useEffect(() => {
    if (workflowStep) {
      let completedSteps = 0
      workflowStep.childSteps?.forEach(item => {
        if (item.completedAt) {
          completedSteps++
        }
      })
      setCompletedSteps(completedSteps)
    }
  }, [workflowStep])

  return (
    <>
      <div className="transition-all duration-300 ease-out overflow-hidden max-h-[500px] opacity-100">
        <div className="animate-fade-in p-4 bg-muted/50 rounded-lg border relative max-h-[480px] overflow-y-auto">
          <button
            onClick={workflowStep.onClose}
            className="absolute top-2 right-2 text-muted-foreground hover:text-foreground transition-colors z-10"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              className="lucide lucide-x w-4 h-4"
            >
              <path d="M18 6 6 18"></path>
              <path d="m6 6 12 12"></path>
            </svg>
          </button>
          <h4 className="font-semibold text-sm mb-3">
            Step {workflowStep.selectedStepIndex}: {workflowStep.name}
          </h4>
          <div className="space-y-2 mb-4">
            {workflowStep.childSteps
              ?.sort((a, b) => (a.sequence || 0) - (b.sequence || 0))
              .map((item: ProjectWorkflowChildStep, index: number) => {
                return (
                  <div
                    key={item.id || item.name || index}
                    className="flex items-center gap-3 pl-3 pt-4 rounded bg-background/50 relative"
                  >
                    <div className="flex-shrink-0">
                      {getStepIcon(item.isActiveStep, item.completedAt, item.startedAt)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span
                          className={`text-base font-medium ${item.isActiveStep ? `text-blue-700` : `text-muted-foreground`}`}
                        >
                          {item.name}
                        </span>
                      </div>
                      {item.description && (
                        <div className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                          {item.description}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
          </div>
          {Array.isArray(workflowStep.childSteps) && workflowStep.childSteps.length > 0 && (
            <div className="border-t pt-2 bg-muted/50 -mx-4 -mb-4 px-4 pb-4 mt-2">
              <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                <span>Progress</span>
                <span>
                  {completedSteps} of {workflowStep.childSteps?.length} completed
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="h-2 rounded-full transition-all bg-blue-500"
                  style={{ width: `${(completedSteps / workflowStep.childSteps?.length) * 100}%` }}
                ></div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

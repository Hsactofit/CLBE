import { ProjectWorkflowChildStep } from '@/lib/interfaces'

enum ProjectProgressStatus {
  Active = 'Active',
  Pending = 'Pending',
  Completed = 'Completed',
}

interface ProjectProgressStepProps {
  title: string
  status: ProjectProgressStatus
  totalSteps: number
  stepIndex: number
  childSteps: ProjectWorkflowChildStep[]
  icon: React.ReactNode
  onStepSelect: any
  completedAt: Date | null
}
export const ProjectProgressStep = ({
  title,
  status,
  stepIndex,
  icon,
  childSteps,
  onStepSelect,
  completedAt,
}: ProjectProgressStepProps) => {
  const getCompletedChildSteps = () => {
    let completedSteps = 0
    Array.isArray(childSteps) &&
      childSteps.forEach(item => {
        if (item.completedAt) {
          completedSteps += 1
        }
      })
    return completedSteps
  }
  const getStatusClasses = (status: ProjectProgressStatus) => {
    const classes = {
      Pending: `gray`,
      Active: `blue`,
      Completed: `green`,
    }
    return classes[status]
  }
  return (
    <>
      <div
        className={`max-w-[160px] hover:scale-95`}
        onClick={() => {
          onStepSelect(stepIndex)
        }}
      >
        <div className="flex flex-col items-center ">
          <div
            className={`relative flex flex-col items-center justify-center py-2 sm:py-3 lg:py-6 rounded-lg lg:rounded-xl cursor-pointer 
                transition-all duration-200 min-h-[200px] p-4 w-full bg-${getStatusClasses(
                  status
                )}-100 border-2 border-${getStatusClasses(status)}-500 hover:shadow-md`}
          >
            <div className="flex flex-col items-center space-y-1 sm:space-y-1 lg:space-y-2">
              {icon}
              <div
                className={`text-[10px] sm:text-xs md:text-sm lg:text-base font-bold text-center px-0.5 
                    leading-tight whitespace-pre-line w-full text-${getStatusClasses(status)}-600`}
              >
                {title}
              </div>
              <div
                className={`text-[9px] sm:text-xs font-medium text-${getStatusClasses(status)}-600`}
              >
                {Array.isArray(childSteps)
                  ? `${getCompletedChildSteps()} of ${childSteps?.length}`
                  : `${completedAt ? 1 : 0} of ${1}`}
              </div>
              <div
                className={`px-2 py-1 rounded-full text-xs font-medium border ${
                  status === 'Completed'
                    ? 'bg-green-100 text-green-800 border-green-400'
                    : status === 'Active'
                      ? 'bg-blue-100 text-blue-800 border-blue-400'
                      : 'bg-gray-100 text-gray-800 border-gray-400'
                }`}
              >
                {status}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

'use client'

import { useState } from 'react'
import { Check } from 'lucide-react'
import { useAuthFetch } from '@/hooks/useAuthFetch'

interface WageTier {
  wage: number
  level: string
  selected: boolean
}

interface WageDeterminationData {
  jobCode: string
  jobName: string
  zipCode: string
  areaCode: string
  areaName: string
  jobDescription: string
  levels: WageTier[]
}

interface WageDeterminationStepProps {
  projectId: string
  onStepCompleted?: () => void
}

export default function WageDeterminationStep({
  projectId,
  onStepCompleted,
}: WageDeterminationStepProps) {
  const authFetch = useAuthFetch()
  const [isCalculating, setIsCalculating] = useState(false)
  const [isCalculated, setIsCalculated] = useState(false)
  const [wageDeterminationData, setWageDeterminationData] = useState<WageDeterminationData | null>(
    null
  )
  const [error, setError] = useState<string | null>(null)
  const tierNames = {
    '1': 'Entry level',
    '2': 'Qualified',
    '3': 'Experienced',
    '4': 'Fully Competent',
  }

  const handleNext = async () => {
    try {
      const response = await authFetch(
        `/projects/${projectId}/steps?workflow_step_key=H1B_WAGE_DETERMINATION`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )

      if (response.ok) {
        if (onStepCompleted) {
          onStepCompleted()
        }
      } else {
        // Log the error details for debugging
        const errorText = await response.text()
        console.error('API Error:', {
          status: response.status,
          statusText: response.statusText,
          body: errorText,
        })
        setError(`Failed to proceed to next step (${response.status}). Please try again.`)
      }
    } catch (err) {
      console.error('Error proceeding to next step:', err)
      setError('An error occurred while proceeding to the next step.')
    }
  }

  const handleCalculate = async () => {
    setIsCalculating(true)
    setError(null)

    try {
      const response = await authFetch(`/projects/${projectId}/wages`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        const data: WageDeterminationData = await response.json()
        setWageDeterminationData(data)
        setIsCalculated(true)

        // Refresh the progress tracker to show completion
        if (onStepCompleted) {
          onStepCompleted()
        }
      } else {
        console.error('Failed to calculate wage determination:', response.status)
        setError('Failed to calculate wage determination. Please try again.')
      }
    } catch (err) {
      console.error('Error calculating wage determination:', err)
      setError('An error occurred while calculating wage determination.')
    } finally {
      setIsCalculating(false)
    }
  }

  return (
    <div>
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
        <p className="text-gray-700 mb-6 leading-relaxed">
          The wage determination process will analyze the job requirements and location to determine
          the prevailing wage that must be paid for this position according to Department of Labor
          regulations.
        </p>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        <div className="flex justify-center items-center">
          {!isCalculated ? (
            <button
              onClick={handleCalculate}
              disabled={isCalculating}
              className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-r from-primary to-secondary hover:from-primary-600 hover:to-secondary-600 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200 min-w-[150px]"
            >
              {isCalculating ? (
                <>
                  <div className="w-4 h-4 border-2 border-transparent border-t-white rounded-full animate-spin mr-2" />
                  Calculating...
                </>
              ) : (
                <>
                  <i className="fas fa-calculator w-4 h-4 mr-2 text-sm" />
                  Calculate
                </>
              )}
            </button>
          ) : (
            <button
              onClick={handleNext}
              className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-r from-primary to-secondary hover:from-primary-600 hover:to-secondary-600 transition-all duration-200 min-w-[150px]"
            >
              Next
              <i className="fas fa-arrow-right w-4 h-4 ml-2 text-sm" />
            </button>
          )}
        </div>
      </div>

      {isCalculated && (
        <div className="space-y-6">
          {/* ONET Code Section */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-start gap-3 mb-4">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold text-sm">
                1
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  ONET code determination
                </h3>
                <p className="text-gray-600 text-sm mb-4">
                  Based on the uploaded employment offer , Crossing has determined that the
                  employee's ONET code is:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <div className="font-semibold text-gray-900 mb-1">
                      {wageDeterminationData?.jobCode}: {wageDeterminationData?.jobName}
                    </div>
                    <div className="text-sm text-gray-600">
                      {wageDeterminationData?.jobDescription}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Wage Tiers Section */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-start gap-3 mb-4">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold text-sm">
                2
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Calculated wage tiers for this location
                </h3>
                <p className="text-gray-600 text-sm mb-6">
                  Based on the Department of Labor's classification for this ONET code and the
                  employer's workplace ZIP code of {wageDeterminationData?.zipCode}, the annual wage
                  tiers for this job are:
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {wageDeterminationData?.levels.map(level => (
                    <div
                      key={level.level}
                      className={`relative rounded-lg p-4 transition-shadow ${
                        level.selected
                          ? 'bg-green-100 border-2 border-green-500'
                          : 'bg-gray-50 border border-gray-200'
                      }`}
                    >
                      {level.selected && (
                        <div className="absolute -top-2 -left-2 h-6 w-6 rounded-full bg-green-500 border border-green-500 flex items-center justify-center shadow-md">
                          <Check size={12} className="text-white" aria-hidden="true" />
                          <span className="sr-only">Selected</span>
                        </div>
                      )}
                      <div className="font-semibold mb-1 text-gray-900">
                        Tier {level.level}: ${Math.round(level.wage).toLocaleString()} annually
                      </div>
                      <div className="text-sm text-gray-500">
                        {tierNames[level.level as keyof typeof tierNames]}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

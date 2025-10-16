'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '@clerk/nextjs'
import { useAuthFetch } from '@/hooks/useAuthFetch'
import LoadingSpinner from '@/components/LoadingSpinner'
import { Project } from '@/types/project'
import { SubTitle } from '@/components/Typography'
import { Typography } from 'antd'
const { Text } = Typography

export const ProjectForms = () => {
  const router = useRouter()
  const authFetch = useAuthFetch()
  const { isSignedIn, isLoaded } = useAuth()
  const [project, setProject] = useState<Project | null>(null)
  const [forms, setForms] = useState<
    Array<{
      publicId: string
      name?: string
      description?: string
      status?: string
      completed: boolean
      createdAt: string
      updatedAt: string
      formTemplateName: string
    }>
  >([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const projectId = router.query.id as string

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push('/login')
    }
  }, [isLoaded, isSignedIn, router])

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const loadProject = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      // Get project and forms data from the forms endpoint
      const formsResponse = await authFetch(`/projects/${projectId}/forms`)

      if (formsResponse.ok) {
        const data = await formsResponse.json()

        // The forms endpoint should return both project and forms data
        if (data.project) {
          setProject(data.project)
        }
        if (data.forms) {
          setForms(data.forms)
        }
      } else {
        console.error('Failed to load forms:', formsResponse.status)
        setError('Failed to load forms. Please try again.')
        return
      }
    } catch (err) {
      console.error('Error loading project:', err)
      setError('An error occurred while loading the project.')
    } finally {
      setLoading(false)
    }
  }, [projectId, authFetch])

  useEffect(() => {
    if (projectId) {
      loadProject()
    }
  }, [projectId, loadProject])

  const handleBackToProjects = () => {
    router.push('/')
  }

  if (!isLoaded) {
    return <LoadingSpinner />
  }

  if (!isSignedIn) {
    return <LoadingSpinner />
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <div>
          <div>
            {/* Skeleton loader for project header */}
            <div className="mb-8">
              <div className="flex items-center space-x-4 mb-6">
                <div className="w-6 h-6 bg-gray-200 rounded animate-pulse"></div>
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gray-200 rounded animate-pulse"></div>
                  <div>
                    <div className="h-8 w-64 bg-gray-200 rounded animate-pulse mb-2"></div>
                    <div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Skeleton for forms list */}
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div className="h-8 w-48 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-6 w-20 bg-gray-200 rounded animate-pulse"></div>
              </div>

              <div className="grid gap-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="bg-white rounded-lg border border-gray-200 p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-8 h-8 bg-gray-200 rounded animate-pulse"></div>
                        <div className="flex-1">
                          <div className="h-5 w-32 bg-gray-200 rounded animate-pulse mb-2"></div>
                          <div className="h-4 w-24 bg-gray-200 rounded animate-pulse mb-1"></div>
                          <div className="h-3 w-20 bg-gray-200 rounded animate-pulse"></div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="h-6 w-20 bg-gray-200 rounded animate-pulse"></div>
                        <div className="h-8 w-24 bg-gray-200 rounded animate-pulse"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white">
        <div>
          <div>
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Error Loading Forms</h2>
              <p className="text-gray-600 mb-6">{error}</p>
              <button
                onClick={handleBackToProjects}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
              >
                Back to Projects
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const getProjectTypeLabel = (type: string) => {
    const typeLabels: Record<string, string> = {
      // Frontend format
      'family-based-greencard': 'Family-Based Green Card',
      'citizenship-application': 'Citizenship Application',
      'employment-based-greencard': 'Employment-Based Green Card',
      // Backend format
      FAMILY_BASED_GREENCARD: 'Family-Based Green Card',
      CITIZENSHIP: 'Citizenship Application',
      EMPLOYMENT_BASED_GREENCARD: 'Employment-Based Green Card',
    }
    return typeLabels[type] || type
  }

  const getProjectTypeIcon = (type: string) => {
    const typeIcons: Record<string, string> = {
      // Frontend format
      'family-based-greencard': '👨‍👩‍👧‍👦',
      'citizenship-application': '📋',
      'employment-based-greencard': '💼',
      // Backend format
      FAMILY_BASED_GREENCARD: '👨‍👩‍👧‍👦',
      CITIZENSHIP: '📋',
      EMPLOYMENT_BASED_GREENCARD: '💼',
    }
    return typeIcons[type] || '📄'
  }

  return (
    <div className="min-h-screen bg-white">
      <div>
        <div>
          {/* Project Header */}
          <div className="mb-8">
            <div className="flex items-center space-x-4 mb-6">
              <div className="flex space-x-3 flex-col justify-start ">
                <SubTitle className=" font-bold text-gray-900">
                  {project ? getProjectTypeLabel(project.type?.name || '') : 'Project Forms'}
                </SubTitle>
                <Text className="!ml-0">Project ID: {projectId}</Text>
              </div>
            </div>

            {/* Project Status - Only show if project details are available */}
            {project && (
              <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Project Details</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-sm font-medium text-gray-500">Project Type:</span>
                        <div className="flex items-center mt-1">
                          <span className="text-2xl mr-2">
                            {getProjectTypeIcon(project.type?.name || '')}
                          </span>
                          <span className="text-sm text-gray-900">
                            {getProjectTypeLabel(project.type?.name || '')}
                          </span>
                        </div>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-500">Status:</span>
                        <span
                          className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${
                            project.completed
                              ? 'bg-green-100 text-green-800 border border-green-200'
                              : 'bg-blue-100 text-blue-800 border border-blue-200'
                          }`}
                        >
                          {project.completed ? 'Completed' : 'In Progress'}
                        </span>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-500">Started:</span>
                        <div className="text-sm text-gray-900 mt-1">
                          {project.startedAt && new Date(project.startedAt).toLocaleDateString()}
                        </div>
                        <div className="text-xs text-gray-500">
                          {project.startedAt && new Date(project.startedAt).toLocaleTimeString()}
                        </div>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-500">Project ID:</span>
                        <div className="text-sm text-gray-900 mt-1 font-mono">
                          {project.publicId}
                        </div>
                      </div>
                    </div>
                  </div>

                  {!project.completed && (
                    <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors">
                      Mark Complete
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Forms List */}
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">Forms</h2>
              <div className="text-sm text-gray-500">
                {project?.completed ? 'All forms completed' : 'Forms in progress'}
              </div>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Form
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Updated
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Progress
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {forms.map(form => (
                    <tr key={form.publicId} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center mr-3">
                            <i className="fas fa-file-lines w-4 h-4 text-gray-400"></i>
                          </div>
                          <div className="text-sm font-medium text-gray-900">
                            {form.formTemplateName || form.name}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {form.description || `Form ${form.formTemplateName || form.name}`}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            form.completed
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {form.completed ? 'Completed' : 'Not Started'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div>{new Date(form.createdAt).toLocaleDateString()}</div>
                        <div className="text-xs text-gray-500">
                          {new Date(form.createdAt).toLocaleTimeString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div>{new Date(form.updatedAt).toLocaleDateString()}</div>
                        <div className="text-xs text-gray-500">
                          {new Date(form.updatedAt).toLocaleTimeString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {form.completed ? '100%' : '0%'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <button
                          onClick={() =>
                            router.push(`/projects/${projectId}/forms/${form.publicId}/sections`)
                          }
                          className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-gradient-to-r from-primary to-secondary hover:from-primary-600 hover:to-secondary-600 transition-all duration-200"
                        >
                          {form.completed ? 'View' : 'Continue'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Empty State */}
            {forms.length === 0 && !loading && (
              <div className="text-center py-12">
                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <i className="fas fa-file-alt w-12 h-12 text-gray-400"></i>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No forms yet</h3>
                <p className="text-gray-600 mb-6">
                  Forms will appear here as they are created for this project
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

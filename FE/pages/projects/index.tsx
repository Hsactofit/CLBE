'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '@clerk/nextjs'
import { useAuthFetch } from '@/hooks/useAuthFetch'
import LoadingSpinner from '@/components/LoadingSpinner'
import { Project } from '@/types/project'
import AuthenticatedLayout from '@/layouts/authenticated'
import { CloudUploadOutlined, EditOutlined } from '@ant-design/icons'
import { ProjectForm } from '@/components/projects/ProjectForm'
import Link from 'next/link'
import { SubTitle, Title } from '@/components/Typography'

export default function ProjectsPage() {
  const router = useRouter()
  const authFetch = useAuthFetch()
  const { isSignedIn, isLoaded } = useAuth()
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showNewProjectModal, setShowNewProjectModal] = useState(false)
  const [project] = useState<Project>({
    beneficiaryFirstName: ``,
    beneficiaryLastName: ``,
    positionTitle: ``,
    typeId: ``,
    type: null,
    filingType: ``,
    deadline: ``,
    priority: ``,
    premiumProcessing: false,
    notes: ``,
  })

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push('/login')
    }
  }, [isLoaded, isSignedIn, router])

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const loadProjects = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await authFetch('/projects')

      if (response.ok) {
        const data: { projects: Project[] } = await response.json()
        setProjects(data.projects)
      } else {
        console.error('Failed to load projects:', response.status)
        setError('Failed to load projects. Please try again.')
      }
    } catch (err) {
      console.error('Error loading projects:', err)
      setError('An error occurred while loading projects.')
    } finally {
      setLoading(false)
    }
  }, [authFetch])

  useEffect(() => {
    if (isSignedIn) {
      loadProjects()
    }
  }, [isSignedIn, loadProjects])

  const handleProjectClick = (projectId?: string) => {
    router.push(`/projects/${projectId}/forms`)
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
          {/* Skeleton loader for header */}
          <div className="mb-8">
            <div className="h-10 w-64 bg-gray-200 rounded animate-pulse mb-2"></div>
            <div className="h-6 w-96 bg-gray-200 rounded animate-pulse"></div>
          </div>

          {/* Skeleton for projects grid */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="bg-white rounded-2xl border border-gray-200 p-6">
                <div className="flex items-center space-x-4 mb-4">
                  <div className="w-12 h-12 bg-gray-200 rounded animate-pulse"></div>
                  <div className="flex-1">
                    <div className="h-6 w-32 bg-gray-200 rounded animate-pulse mb-2"></div>
                    <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="h-4 w-full bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-4 w-3/4 bg-gray-200 rounded animate-pulse"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white">
        <div>
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Error Loading Projects</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={loadProjects}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    )
  }

  function handleUploadClick(projectId?: string) {
    router.push(`/projects/${projectId}/document-upload`)
  }

  return (
    <AuthenticatedLayout>
      <div className="min-h-screen bg-white">
        <div>
          {/* Header */}
          <div className="mb-8 flex items-center justify-between">
            <div>
              <Title className="text-4xl font-bold text-gray-900">My Applications</Title>
              <SubTitle>Manage your immigration applications and track their progress</SubTitle>
            </div>
            <button
              onClick={() => setShowNewProjectModal(true)}
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-gradient-to-r from-primary to-secondary hover:from-primary-600 hover:to-secondary-600 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              <i className="fas fa-plus w-5 h-5 mr-2"></i>
              New Application
            </button>
          </div>
          {/* Projects Table */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Beneficiary
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Started
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Deadline
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Priority
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {projects.map((projectItem: Project, index: number) => (
                  <tr
                    key={`${index}`}
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => router.push(`/projects/${projectItem.publicId}`)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {projectItem.beneficiaryFirstName}{' '}
                            {projectItem.beneficiaryLastName || ''}
                          </div>
                          <div className="text-sm text-gray-500">
                            {projectItem.positionTitle || ''}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {projectItem.type?.name || ''}
                          </div>
                          <div className="text-sm text-gray-500">
                            {projectItem.type?.description || ''}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {projectItem.startedAt
                        ? new Date(projectItem.startedAt).toLocaleDateString()
                        : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {projectItem.deadline
                        ? new Date(projectItem.deadline).toLocaleDateString()
                        : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          projectItem.completed
                            ? 'bg-green-100 text-green-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {projectItem.completed ? 'Completed' : 'In Progress'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          projectItem.priority === 'HIGH'
                            ? 'bg-red-100 text-red-800'
                            : projectItem.priority === 'MEDIUM'
                              ? 'bg-yellow-100 text-yellow-800'
                              : projectItem.priority === 'LOW'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {projectItem.priority
                          ? projectItem.priority.charAt(0) +
                            projectItem.priority.slice(1).toLowerCase()
                          : 'Not Set'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* New Project Modal */}
          {showNewProjectModal && (
            <ProjectForm
              setShowNewProjectModal={setShowNewProjectModal}
              project={project}
            ></ProjectForm>
          )}
        </div>
      </div>
    </AuthenticatedLayout>
  )
}

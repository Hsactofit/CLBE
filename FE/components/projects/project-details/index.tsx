'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/router'
import { useAuth } from '@clerk/nextjs'
import { useAuthFetch } from '@/hooks/useAuthFetch'

import LoadingSpinner from '@/components/LoadingSpinner'
import { Project } from '@/types/project'
import AuthenticatedLayout from '@/layouts/authenticated'
import { ProgressTracker } from '@/components/projects/project-details/ProgressTracker'
import { notification } from 'antd'
import { SubTitle, Title } from '@/components/Typography'

export const ProjectDetails = () => {
  const router = useRouter()
  const authFetch = useAuthFetch()
  const { isSignedIn, isLoaded } = useAuth()
  const [project, setProject] = useState<Project | null>(null)
  const [isProjectLoading, setIsProjectLoading] = useState(true)
  const [toastNotification] = notification.useNotification()
  const projectId = router.query.id as string

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push('/login')
    }
  }, [isLoaded, isSignedIn, router])

  //   eslint-disable-next-line react-hooks/exhaustive-deps
  const loadProject = useCallback(async () => {
    try {
      setIsProjectLoading(true)

      const response = await authFetch(`/projects/${projectId}`)

      if (response.ok) {
        const project: Project = await response.json()
        setProject(project)
      } else if (response.status === 404) {
        toastNotification.error({
          message:
            'Project not found. This project may have been deleted or you may not have access to it.',
          duration: 3,
        })
        // Redirect to home page after a short delay
        setTimeout(() => {
          router.push('/projects')
        }, 3000)
      } else {
        toastNotification.error({
          message: 'Failed to load project. Please try again.',
          duration: 3,
        })
      }
    } catch (err) {
      toastNotification.error({
        message: 'An error occurred while loading the project.',
        duration: 3,
      })
    } finally {
      setIsProjectLoading(false)
    }
  }, [projectId, router, authFetch])

  useEffect(() => {
    if (projectId) {
      loadProject()
    }
  }, [projectId, loadProject])

  const handleBackToProjects = () => {
    router.push('/projects')
  }

  if (!isLoaded) {
    return <LoadingSpinner />
  }

  if (!isSignedIn) {
    return <LoadingSpinner />
  }

  if (!isProjectLoading && !project) {
    return (
      <AuthenticatedLayout>
        <div className="min-h-screen bg-white">
          <div>
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Project Not Found</h2>
              <p className="text-gray-600 mb-6">
                The project you&apos;re looking for doesn&apos;t exist.
              </p>
              <button
                onClick={handleBackToProjects}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
              >
                Back to Projects
              </button>
            </div>
          </div>
        </div>
      </AuthenticatedLayout>
    )
  }

  return (
    <AuthenticatedLayout>
      {project && (
        <>
          <Title className="text-4xl font-bold text-gray-900">
            {project?.beneficiaryFirstName || ''} {project?.beneficiaryLastName || ''}
          </Title>
          <SubTitle className="!ml-0">
            {project?.positionTitle || ''} - {project.type?.name || ''}
          </SubTitle>
          <div className="mt-5">
            <ProgressTracker project={project}></ProgressTracker>
          </div>
        </>
      )}
    </AuthenticatedLayout>
  )
}

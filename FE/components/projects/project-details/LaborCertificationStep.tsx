'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { notification, Button, Card, Typography, Steps, Alert } from 'antd'
import { useAuthFetch } from '@/hooks/useAuthFetch'
import { SubTitle, Title } from '@/components/Typography'

const { Text, Paragraph } = Typography
const { Step } = Steps

interface LaborCertificationStepProps {
  projectId: string
  onStepCompleted?: () => void
}

export const LaborCertificationStep: React.FC<LaborCertificationStepProps> = ({
  projectId,
  onStepCompleted,
}) => {
  const router = useRouter()
  const authFetch = useAuthFetch()
  const [api, contextHolder] = notification.useNotification()
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [certificationStatus, setCertificationStatus] = useState<string>('pending')

  // DOL Labor Certification process steps
  const dolSteps = [
    {
      title: 'PERM Application Preparation',
      description: 'Prepare and review PERM labor certification application',
      status: 'process',
    },
    {
      title: 'Job Order Posting',
      description: 'Post job order with State Workforce Agency (SWA)',
      status: 'wait',
    },
    {
      title: 'Recruitment Process',
      description: 'Conduct required recruitment activities',
      status: 'wait',
    },
    {
      title: 'DOL Filing',
      description: 'File PERM application with Department of Labor',
      status: 'wait',
    },
    {
      title: 'DOL Review',
      description: 'DOL reviews and processes the application',
      status: 'wait',
    },
    {
      title: 'Certification Decision',
      description: 'Receive labor certification decision',
      status: 'wait',
    },
  ]

  const handleStartProcess = async () => {
    setIsProcessing(true)
    setError(null)

    try {
      // Call backend API to initiate DOL labor certification process
      const response = await authFetch(`/projects/${projectId}/dol-labor-certification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        api.success({
          message: 'DOL Process Initiated',
          description: 'The DOL labor certification process has been started successfully.',
          duration: 3,
        })
        setCertificationStatus('in_progress')
      } else {
        const errorText = await response.text()
        console.error('API Error:', {
          status: response.status,
          statusText: response.statusText,
          body: errorText,
        })
        setError(`Failed to start DOL process (${response.status}). Please try again.`)
      }
    } catch (err) {
      console.error('Error starting DOL process:', err)
      setError('An error occurred while starting the DOL labor certification process.')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleNext = async () => {
    setIsProcessing(true)
    setError(null)

    try {
      const response = await authFetch(
        `/projects/${projectId}/steps?workflow_step_key=H1B_DOL_LABOR_CERTIFICATION`,
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
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div style={{ padding: '24px', maxWidth: '800px', margin: '0 auto' }}>
      {contextHolder}

      {error && (
        <Alert
          message="Error"
          description={error}
          type="error"
          closable
          onClose={() => setError(null)}
          style={{ marginBottom: '24px' }}
        />
      )}

      <Card title="Labor Condition Application (LCA)" style={{ marginBottom: '24px' }}>
        <Paragraph>
          The Department of Labor certification process demonstrates that there are no qualified
          U.S. workers available for the position.
        </Paragraph>
        <Paragraph>
          As part of the LCA, employers must provide notice to U.S. workers that they are filing a
          labor condition application for foreign employees, so that current employees have
          awareness and the opportunity to object if they feel something is improper.
        </Paragraph>
        <Paragraph>
          The employer must also provide each H-1B non-immigrant worker (the beneficiary) with a
          copy of the certified LCA.
        </Paragraph>
      </Card>

      <Card title="ETA-9035 Notice Instructions" style={{ marginBottom: '24px' }}>
        <Paragraph>
          The employer should post a notice in at least two conspicuous locations at each place of
          employment where H-1B (or H-1B1 / E-3) workers will be employed (including third-party
          worksites).{' '}
        </Paragraph>{' '}
        <Paragraph>
          The posting must be visible to workers in the occupational classification, in locations
          where employees are likely to see it (e.g. by wage notice boards, break rooms, etc.).
        </Paragraph>
        <Paragraph>
          It must stay posted for 10 consecutive business days within the 30-day window before
          filing.
        </Paragraph>
        <div
          style={{
            marginTop: '16px',
            padding: '16px',
            backgroundColor: '#f6f8fa',
            borderRadius: '8px',
            border: '1px solid #e1e4e8',
          }}
        >
          <Button
            type="link"
            href="/forms/ETA-9035.pdf"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              padding: '0',
              height: 'auto',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '14px',
            }}
          >
            <i className="fas fa-download" style={{ fontSize: '14px' }} />
            ETA-9035 Labor Condition Application Form (PDF)
          </Button>
        </div>
      </Card>

      <Card title="Current Status" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Text strong>Status: </Text>
          <Text
            style={{
              color:
                certificationStatus === 'pending'
                  ? '#faad14'
                  : certificationStatus === 'in_progress'
                    ? '#1890ff'
                    : '#52c41a',
              textTransform: 'capitalize',
            }}
          >
            {certificationStatus.replace('_', ' ')}
          </Text>
        </div>

        <Paragraph style={{ marginTop: '16px', marginBottom: 0 }}>
          The DOL labor certification process is currently in progress. We will notify you of any
          updates.
        </Paragraph>
      </Card>
    </div>
  )
}

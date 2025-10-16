// API configuration and helper functions
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export interface ApiResponse<T = unknown> {
  data?: T
  error?: string
  status: number
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

// Helper function to make API calls
export async function apiCall<T = unknown>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const url = `${API_BASE_URL}${endpoint}`

  const defaultHeaders = {
    'Content-Type': 'application/json',
  }

  const config: RequestInit = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  }

  try {
    const response = await fetch(url, config)

    if (!response.ok) {
      throw new ApiError(response.status, `HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    return { data, status: response.status }
  } catch (error) {
    if (error instanceof ApiError) {
      throw error
    }
    throw new ApiError(
      500,
      `Network error: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}

// API endpoints
export const API_ENDPOINTS = {
  // Users
  USERS: '/users',
  USER_ME: '/users/me',

  // Projects
  PROJECTS: '/projects',
  PROJECT: (id: string) => `/projects/${id}`,

  // Forms
  FORMS: (projectId: string) => `/projects/${projectId}/forms`,
  FORM_SECTIONS: (projectId: string, formId: string) =>
    `/projects/${projectId}/forms/${formId}/sections`,
  SECTION_FIELDS: (projectId: string, formId: string, sectionId: string) =>
    `/projects/${projectId}/forms/${formId}/sections/${sectionId}`,

  LOGIN: '/login',
  CLIENT_REGISTRATION: '/clients/registration',
  CLIENT_SIGNUP: '/clients/signup',

  SSO_CALLBACK: '/sso-callback',
  PRIVACY_POLICY: '/privacy-policy',
  TERMS_OF_USE: '/terms-of-use',
  TEST: '/test',

  // Health check
  HEALTH: '/',
} as const

// Application configuration
export const config = {
  // API Configuration
  api: {
    baseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
    timeout: 10000, // 10 seconds
  },

  // Development settings
  dev: {
    enableDebugLogs: process.env.NODE_ENV === 'development',
  },

  // Feature flags
  features: {
    enableRealTimeUpdates: true,
    enableOfflineMode: false,
  },
} as const

// Helper function to get API URL
export function getApiUrl(endpoint: string): string {
  return `${config.api.baseUrl}${endpoint}`
}

// Helper function to check if we're in development mode
export function isDevelopment(): boolean {
  return process.env.NODE_ENV === 'development'
}

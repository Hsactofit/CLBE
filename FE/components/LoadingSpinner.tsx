interface LoadingSpinnerProps {
  isRedirecting?: boolean
}

export default function LoadingSpinner({ isRedirecting = false }: LoadingSpinnerProps) {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
        <p className="text-gray-600 text-lg font-medium">
          {isRedirecting ? 'Completing sign in...' : 'Loading Crossing Legal AI...'}
        </p>
        {isRedirecting && (
          <p className="text-gray-500 text-sm mt-2">Please wait while we set up your account</p>
        )}
      </div>
    </div>
  )
}

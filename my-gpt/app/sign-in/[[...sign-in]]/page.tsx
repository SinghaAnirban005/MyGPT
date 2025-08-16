import { SignIn } from '@clerk/nextjs'

export default function Page() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <SignIn
        appearance={{
          elements: {
            rootBox: 'w-full max-w-md',
            card: 'shadow-lg rounded-lg border border-gray-200',
            headerTitle: 'text-2xl font-bold text-gray-800',
            headerSubtitle: 'text-gray-600',
            socialButtonsBlockButton: 'border-gray-300 hover:bg-gray-50',
            footerActionText: 'text-gray-600',
            footerActionLink: 'text-blue-600 hover:text-blue-800',
          },
        }}
      />
    </div>
  )
}

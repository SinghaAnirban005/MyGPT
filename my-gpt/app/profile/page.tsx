import { currentUser } from '@clerk/nextjs/server'

export default async function ProfilePage() {
  const user = await currentUser()

  if (!user) {
    return <div>Not authenticated</div>
  }

  return (
    <div className="mx-auto max-w-2xl p-4">
      <h1 className="mb-4 text-2xl font-bold">Your Profile</h1>
      <div className="space-y-4">
        <div>
          <h2 className="font-semibold">Name</h2>
          <p>{user.fullName}</p>
        </div>
        <div>
          <h2 className="font-semibold">Email</h2>
          <p>{user.primaryEmailAddress?.emailAddress}</p>
        </div>
      </div>
    </div>
  )
}

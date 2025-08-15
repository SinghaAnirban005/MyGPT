'use client'
import Link from 'next/link'
import { UserDropdown } from './user-button'
import { Button } from './ui/button'
import { useUser } from '@clerk/nextjs'

export function Navbar() {
  const { isSignedIn } = useUser()
  
  return (
    <nav className="border-b border-gray-200 px-4 py-3 flex justify-between items-center">
      <Link href="/" className="font-bold text-xl">
        ChatGPT Clone
      </Link>
      <div>
        {isSignedIn ? (
          <UserDropdown />
        ) : (
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link href="/sign-in">Sign In</Link>
            </Button>
            <Button asChild>
              <Link href="/sign-up">Sign Up</Link>
            </Button>
          </div>
        )}
      </div>
    </nav>
  )
}
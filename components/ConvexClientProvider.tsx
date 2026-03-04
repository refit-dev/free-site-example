'use client'

import { ReactNode, useEffect } from 'react'
import { ConvexReactClient, Authenticated, Unauthenticated, AuthLoading, useMutation } from 'convex/react'
import { ConvexProviderWithClerk } from 'convex/react-clerk'
import { useAuth } from '@clerk/nextjs'
import { api } from '@/convex/_generated/api'

if (!process.env.NEXT_PUBLIC_CONVEX_URL) {
  throw new Error('Missing NEXT_PUBLIC_CONVEX_URL in your .env file')
}

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL)

function UserSync() {
  const storeUser = useMutation(api.users.storeUser);
  const { isLoaded, isSignedIn } = useAuth();

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      void storeUser();
    }
  }, [isLoaded, isSignedIn, storeUser]);

  return null;
}

export default function ConvexClientProvider({ children }: { children: ReactNode }) {
  return (
    <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
      <Authenticated>
        <UserSync />
        {children}
      </Authenticated>
      <Unauthenticated>
        {children}
      </Unauthenticated>
      <AuthLoading>
        {children}
      </AuthLoading>
    </ConvexProviderWithClerk>
  )
}

'use client'
import React from 'react'
import { useSession } from '@/lib/hooks/useSession';

const BB = () => {
    const { session, isLoading, isAuthenticated, user } = useSession();
    if (isLoading) {
        return <div>Loading...</div>;
    }

    if (!isAuthenticated) {
        return <div>Please sign in</div>;
    }
    console.log(session)
  return (
    <div>
      kjhfkjhgrf
          return (
          <div>
              <h1>Welcome {user.firstName}</h1>
              <p>User ID: {user.id}</p>
              <p>Mobile: {user.mobile}</p>
              {/* API token is NOT available here for security reasons */}
          </div>
          );
    </div>
  )
}

export default BB

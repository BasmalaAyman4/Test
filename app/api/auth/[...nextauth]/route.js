import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

const authOptions = {
  providers: [
    CredentialsProvider({
      id: "credentials",
      name: "Credentials",
      credentials: {
        id: { label: "ID", type: "text" },
        mobile: { label: "Mobile", type: "text" },
        token: { label: "Token", type: "text" },
        firstName: { label: "First Name", type: "text" },
        lastName: { label: "Last Name", type: "text" },
        address: { label: "Address", type: "text" }
      },

      async authorize(credentials) {
        try {
          if (!credentials?.token || !credentials?.id) {
            console.error("Missing credentials in authorize");
            return null;
          }

          console.log("Authorizing user:", { id: credentials.id, mobile: credentials.mobile });

        

          return {
            id: credentials.id,
            mobile: credentials.mobile,
            firstName: credentials.firstName,
            lastName: credentials.lastName,
            address: credentials.address || null,
            accessToken: credentials.token,
          };
        } catch (error) {
          console.error("Authorization error:", error);
          return null;
        }
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.mobile = user.mobile;
        token.firstName = user.firstName;
        token.lastName = user.lastName;
        token.address = user.address;
        token.accessToken = user.accessToken;
      }
      return token;
    },

    async session({ session, token }) {
      session.user = {
        id: token.id,
        mobile: token.mobile,
        firstName: token.firstName,
        lastName: token.lastName,
        address: token.address,
      };
      // Keep access token in server session only
      session.accessToken = token.accessToken;
      return session;
    },
  },

  // FIXED: Use JWT instead of database sessions for simplicity
  session: {
    strategy: "jwt", // Changed from "database" to "jwt"
    maxAge: 24 * 60 * 60, // 24 hours
    updateAge: 2 * 60 * 60, // 2 hours
  },

  // Secure cookie settings
  cookies: {
    sessionToken: {
      name: process.env.NODE_ENV === 'production'
        ? '__Secure-next-auth.session-token'
        : 'next-auth.session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        // Remove domain setting for localhost
        ...(process.env.NODE_ENV === 'production' && { domain: '.yourdomain.com' })
      }
    }
  },

  pages: {
    signIn: "/en/signin", // Fixed: include locale
    error: "/en/signin",
  },

  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === 'development', // Enable debug in development

  events: {
    async signOut({ token }) {
      try {
        if (token?.accessToken) {
          // Invalidate token on the API server
          await invalidateTokenOnAPI(token.accessToken);
          
          // Log the signout event
          if (process.env.NODE_ENV === 'development') {
            console.log('User signed out, token invalidated');
          }
        }
      } catch (error) {
        // Don't block signout if token invalidation fails
        if (process.env.NODE_ENV === 'development') {
          console.error('Token invalidation failed during signout:', error);
        }
      }
    },
    async signIn({ user, account, profile }) {
      if (process.env.NODE_ENV === 'development') {
        console.log("Sign in event:", { user: user?.id, account: account?.provider });
      }
      return true;
    },
    async session({ session, token }) {
      // Only log in development
      if (process.env.NODE_ENV === 'development') {
        console.log("Session event:", { userId: session?.user?.id });
      }
      return true;
    }
  },
};

// Helper function to verify token with your API
async function verifyTokenWithAPI(token) {
  try {
    const response = await fetch(`${process.env.API_BASE_URL}/auth/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ token })
    });

    return response.ok;
  } catch (error) {
    console.error('Token verification failed:', error);
    return false;
  }
}

// Helper function to invalidate token
async function invalidateTokenOnAPI(token) {
  try {
    await fetch(`${process.env.API_BASE_URL}/auth/logout`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
  } catch (error) {
    console.error('Token invalidation failed:', error);
  }
}

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST, authOptions };
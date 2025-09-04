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
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
        token.mobile = user.mobile;
        token.firstName = user.firstName;
        token.lastName = user.lastName;
        token.address = user.address;
        token.accessToken = user.accessToken;
        token.tokenIssuedAt = Date.now();
        token.tokenExpiresAt = Date.now() + (24 * 60 * 60 * 1000); // 24 hours
      }

      // Check token expiration and refresh if needed
      if (token.tokenExpiresAt && Date.now() > token.tokenExpiresAt) {
        try {
          const refreshedToken = await refreshAccessToken(token.accessToken);
          if (refreshedToken) {
            token.accessToken = refreshedToken.accessToken;
            token.tokenIssuedAt = Date.now();
            token.tokenExpiresAt = Date.now() + (24 * 60 * 60 * 1000);
          } else {
            // Token refresh failed, force re-authentication
            return null;
          }
        } catch (error) {
          console.error('Token refresh failed:', error);
          return null;
        }
      }

      return token;
    },

    async session({ session, token }) {
      // Validate token before creating session
      if (!token || !token.accessToken) {
        return null;
      }

      // Check if token is still valid
      if (token.tokenExpiresAt && Date.now() > token.tokenExpiresAt) {
        return null;
      }

      session.user = {
        id: token.id,
        mobile: token.mobile,
        firstName: token.firstName,
        lastName: token.lastName,
        address: token.address,
      };
      
      // Don't expose access token to client-side session
      // Keep it server-side only for API calls
      session.accessToken = token.accessToken;
      session.tokenExpiresAt = token.tokenExpiresAt;
      
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
        sameSite: 'strict', // Enhanced security: changed from 'lax' to 'strict'
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60, // 24 hours
        // Remove domain setting for localhost
        ...(process.env.NODE_ENV === 'production' && { domain: '.yourdomain.com' })
      }
    },
    callbackUrl: {
      name: process.env.NODE_ENV === 'production'
        ? '__Secure-next-auth.callback-url'
        : 'next-auth.callback-url',
      options: {
        httpOnly: true,
        sameSite: 'strict',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60
      }
    },
    csrfToken: {
      name: process.env.NODE_ENV === 'production'
        ? '__Host-next-auth.csrf-token'
        : 'next-auth.csrf-token',
      options: {
        httpOnly: true,
        sameSite: 'strict',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60
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
      if (token.accessToken) {
        await invalidateTokenOnAPI(token.accessToken);
      }
    },
    async signIn({ user, account, profile }) {
      console.log("Sign in event:", { user: user.id, account: account?.provider });
      return true;
    },
    async session({ session, token }) {
      console.log("Session event:", { userId: session.user?.id });
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

// Helper function to refresh access token
async function refreshAccessToken(token) {
  try {
    const response = await fetch(`${process.env.API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ token })
    });

    if (response.ok) {
      const data = await response.json();
      return {
        accessToken: data.accessToken || data.token,
        refreshToken: data.refreshToken
      };
    }
    return null;
  } catch (error) {
    console.error('Token refresh failed:', error);
    return null;
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
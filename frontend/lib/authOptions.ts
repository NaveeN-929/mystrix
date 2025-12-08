import NextAuth, { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET || 'mystrix-development-secret-change-in-production',
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/login',
  },
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Please provide email and password')
        }

        const response = await fetch(`${API_URL}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: credentials.email,
            password: credentials.password,
          }),
        })

        if (!response.ok) {
          const error = await response.json().catch(() => ({}))
          throw new Error(error.error || error.message || 'Invalid credentials')
        }

        const data = await response.json()

        if (!data?.user || !data?.token) {
          throw new Error('Invalid login response')
        }

        return {
          id: data.user.id,
          name: data.user.name,
          email: data.user.email,
          phone: data.user.phone,
          token: data.token,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.user = {
          id: user.id as string,
          name: user.name as string,
          email: user.email as string,
          phone: (user as any).phone as string | undefined,
        }
        token.accessToken = (user as any).token as string
      }
      return token
    },
    async session({ session, token }) {
      session.user = {
        id: (token.user as any)?.id,
        name: (token.user as any)?.name,
        email: (token.user as any)?.email,
        phone: (token.user as any)?.phone,
      }
      session.accessToken = token.accessToken as string | undefined
      return session
    },
  },
}

// Export handler for potential server-side usage
export const authHandler = NextAuth(authOptions)


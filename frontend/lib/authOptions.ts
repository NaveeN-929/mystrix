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
        rewardAmount: { label: 'Reward Amount', type: 'text' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Please provide email and password')
        }

        const response = await fetch(`${API_URL}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: credentials?.email,
            password: credentials?.password,
            rewardAmount: credentials.rewardAmount ? Number(credentials.rewardAmount) : undefined
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
          walletBalance: data.user.walletBalance,
          token: data.token,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.user = {
          id: user.id as string,
          name: user.name as string,
          email: user.email as string,
          phone: user.phone as string | undefined,
          walletBalance: user.walletBalance,
        }
        token.accessToken = user.token as string
      }

      // Support manual updates to the session (e.g. after using wallet)
      if (trigger === "update" && session?.user) {
        token.user = {
          ...token.user,
          ...session.user
        }
      }

      return token
    },
    async session({ session, token }) {
      session.user = {
        id: token.user?.id || '',
        name: token.user?.name || '',
        email: token.user?.email || '',
        phone: token.user?.phone,
        walletBalance: token.user?.walletBalance,
      } as {
        id: string;
        name: string;
        email: string;
        phone?: string;
        walletBalance?: number;
      }
      session.accessToken = token.accessToken as string | undefined
      return session
    },
  },
}

// Export handler for potential server-side usage
export const authHandler = NextAuth(authOptions)


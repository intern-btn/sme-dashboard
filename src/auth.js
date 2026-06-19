import NextAuth from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { prisma } from './lib/db.js'
import { verifyPassword } from './lib/auth.js'

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        username: { label: 'Username', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      authorize: async (credentials) => {
        const username = credentials?.username
        const password = credentials?.password
        if (!username || !password) return null

        const user = await prisma.user.findUnique({ where: { username } })
        if (!user || !user.isActive) return null

        const valid = await verifyPassword(password, user.passwordHash)
        if (!valid) return null

        return {
          id: user.id,
          name: user.username,
          role: user.role,
          accessScope: user.accessScope || 'national',
          kanwil: user.kanwil || null,
          cabang: user.cabang || null,
          mustChangePassword: user.mustChangePassword ?? false,
          totpEnabled: user.totpEnabled ?? false,
          totpLastVerifiedAt: user.totpLastVerifiedAt ?? null,
        }
      },
    }),
    // Future: Microsoft Entra ID provider can be added here without rewriting consumers.
  ],
  session: {
    strategy: 'jwt',
    maxAge: 8 * 60 * 60, // 8 hours — one workday
  },
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.role = user.role
        token.name = user.name
        token.accessScope = user.accessScope || 'national'
        token.kanwil = user.kanwil || null
        token.cabang = user.cabang || null
        const TOTP_WINDOW_MS = 24 * 60 * 60 * 1000
        const recentlyVerified = user.totpLastVerifiedAt &&
          (Date.now() - new Date(user.totpLastVerifiedAt).getTime()) < TOTP_WINDOW_MS
        token.totpVerified = user.totpEnabled && !!recentlyVerified
        token.mustChangePassword = user.mustChangePassword === true
      }

      if (trigger === 'update' && session?.totpVerified === true) {
        token.totpVerified = true
      }
      if (trigger === 'update' && session?.mustChangePassword === false) {
        token.mustChangePassword = false
      }

      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub
        session.user.role = token.role
        session.user.name = token.name
        session.user.accessScope = token.accessScope || 'national'
        session.user.kanwil = token.kanwil || null
        session.user.cabang = token.cabang || null
        session.user.totpVerified = token.totpVerified === true
        session.user.mustChangePassword = token.mustChangePassword === true
      }
      return session
    },
  },
  pages: {
    signIn: '/login',
  },
  secret: process.env.NEXTAUTH_SECRET,
}

export default NextAuth(authOptions)

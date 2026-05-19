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

        return { id: user.id, name: user.username, role: user.role, mustChangePassword: user.mustChangePassword ?? false }
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
        token.totpVerified = false
        token.mustChangePassword = user.mustChangePassword === true
      }

      if (trigger === 'update' && session?.totpVerified === true) {
        token.totpVerified = true
      }
      if (trigger === 'update' && session?.mustChangePassword === false) {
        // Verify against DB — don't trust client payload for security-sensitive flags
        // Called from change-password page after confirmed DB write
        const freshUser = await prisma.user.findUnique({
          where: { id: token.sub },
          select: { mustChangePassword: true }
        })
        token.mustChangePassword = freshUser?.mustChangePassword ?? true
      }

      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub
        session.user.role = token.role
        session.user.name = token.name
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

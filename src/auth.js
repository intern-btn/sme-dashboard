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

        return { id: user.id, name: user.username, role: user.role }
      },
    }),
    // Future: Microsoft Entra ID provider can be added here without rewriting consumers.
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role
        token.name = user.name
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.role = token.role
        session.user.name = token.name
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


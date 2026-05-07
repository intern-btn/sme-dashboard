import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth/next'
import QRCode from 'qrcode'
import { authOptions } from '../../auth.js'
import { prisma } from '../../lib/db.js'
import { generateTotpSecret, getTotpAuthUrl } from '../../lib/totp.js'
import OtpForms from './OtpForms'

export const dynamic = 'force-dynamic'

export default async function VerifyOtpPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect('/login')
  if (session.user.totpVerified === true) redirect('/')

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      username: true,
      totpEnabled: true,
      isActive: true,
    },
  })

  if (!user?.isActive) redirect('/login')

  const isEnrolling = user.totpEnabled !== true
  const secret = isEnrolling ? generateTotpSecret() : ''
  const otpauthUrl = isEnrolling
    ? getTotpAuthUrl({ username: user.username, secret })
    : ''
  const qrCodeDataUrl = isEnrolling ? await QRCode.toDataURL(otpauthUrl) : ''

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="px-6 py-5 text-white" style={{ backgroundColor: '#003d7a' }}>
          <div className="font-bold text-lg leading-tight">Two-Factor Authentication</div>
          <div className="text-xs opacity-90 mt-1">
            {isEnrolling ? 'First-time enrollment required' : 'Step 2 of login'}
          </div>
        </div>
        <OtpForms
          mode={isEnrolling ? 'enroll' : 'verify'}
          secret={secret}
          qrCodeDataUrl={qrCodeDataUrl}
          otpauthUrl={otpauthUrl}
        />
      </div>
    </div>
  )
}

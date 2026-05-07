export function getClientIp(request) {
  const forwardedFor = request.headers.get('x-forwarded-for')
  if (forwardedFor) return forwardedFor.split(',')[0].trim()
  return request.headers.get('x-real-ip') || ''
}

export function getUserAgent(request) {
  return request.headers.get('user-agent') || ''
}

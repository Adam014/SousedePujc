import { NextResponse } from 'next/server'
import dns from 'dns'

function checkMxRecords(domain: string): Promise<boolean> {
  return new Promise((resolve) => {
    dns.resolveMx(domain, (err, addresses) => {
      if (err || !addresses || addresses.length === 0) {
        resolve(false)
      } else {
        resolve(true)
      }
    })
  })
}

export async function POST(request: Request) {
  try {
    const { email } = await request.json()

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ valid: false, reason: 'missing_email' })
    }

    const domain = email.split('@')[1]
    if (!domain) {
      return NextResponse.json({ valid: false, reason: 'invalid_format' })
    }

    const hasMx = await checkMxRecords(domain)

    if (!hasMx) {
      return NextResponse.json({ valid: false, reason: 'no_mx_records' })
    }

    return NextResponse.json({ valid: true })
  } catch {
    return NextResponse.json({ valid: true })
  }
}

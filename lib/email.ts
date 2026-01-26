import { Resend } from 'resend'
import { formatDateCZ, formatDateRangeCZ } from './utils'

// Initialize Resend client (will be undefined if API key not set)
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

const EMAIL_FROM = process.env.EMAIL_FROM || 'SousedePujc <noreply@sousedepujc.cz>'
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://sousedepujc.cz'

export interface BookingEmailData {
  recipientEmail: string
  recipientName: string
  itemTitle: string
  startDate: string
  endDate: string
  totalAmount: number
  ownerName?: string
  ownerEmail?: string
  borrowerName?: string
  borrowerEmail?: string
  reason?: string
  bookingId?: string
  itemId?: string
}

// Check if email service is configured
export function isEmailConfigured(): boolean {
  return resend !== null
}

// Send booking confirmation email to borrower
export async function sendBookingConfirmedEmail(data: BookingEmailData): Promise<boolean> {
  if (!resend) {
    console.log('Email service not configured, skipping email')
    return false
  }

  try {
    const { error } = await resend.emails.send({
      from: EMAIL_FROM,
      to: data.recipientEmail,
      subject: `Rezervace potvrzena: ${data.itemTitle}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(to right, #1e40af, #3b82f6); color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 20px; border-radius: 0 0 8px 8px; }
            .info-box { background: white; padding: 15px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #22c55e; }
            .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #6b7280; }
            .button { display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 15px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Rezervace potvrzena!</h1>
            </div>
            <div class="content">
              <p>Dobry den ${data.recipientName},</p>
              <p>Skvela zprava! Vase rezervace byla potvrzena majitelem.</p>

              <div class="info-box">
                <p><strong>Predmet:</strong> ${data.itemTitle}</p>
                <p><strong>Datum:</strong> ${formatDateRangeCZ(data.startDate, data.endDate)}</p>
                <p><strong>Celkova cena:</strong> ${data.totalAmount} Kc</p>
              </div>

              ${data.ownerName ? `
              <div class="info-box">
                <p><strong>Kontakt na majitele:</strong></p>
                <p>${data.ownerName}${data.ownerEmail ? ` (${data.ownerEmail})` : ''}</p>
              </div>
              ` : ''}

              <p>Pro vice informaci navstivte svuj profil.</p>

              <a href="${APP_URL}/profile?tab=bookings" class="button">Zobrazit rezervaci</a>
            </div>
            <div class="footer">
              <p>Dekujeme, ze pouzivate SousedePujc!</p>
              <p>Tento email byl odeslan automaticky, prosim neodpovidejte na nej.</p>
            </div>
          </div>
        </body>
        </html>
      `
    })

    if (error) {
      console.error('Error sending booking confirmed email:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Error sending booking confirmed email:', error)
    return false
  }
}

// Send booking cancellation email to borrower
export async function sendBookingCancelledEmail(data: BookingEmailData): Promise<boolean> {
  if (!resend) {
    console.log('Email service not configured, skipping email')
    return false
  }

  try {
    const { error } = await resend.emails.send({
      from: EMAIL_FROM,
      to: data.recipientEmail,
      subject: `Rezervace zamitnuta: ${data.itemTitle}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(to right, #dc2626, #ef4444); color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 20px; border-radius: 0 0 8px 8px; }
            .info-box { background: white; padding: 15px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #ef4444; }
            .reason-box { background: #fef2f2; padding: 15px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #ef4444; }
            .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #6b7280; }
            .button { display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 15px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Rezervace zamitnuta</h1>
            </div>
            <div class="content">
              <p>Dobry den ${data.recipientName},</p>
              <p>Bohuzel vase rezervace byla zamitnuta majitelem.</p>

              <div class="info-box">
                <p><strong>Predmet:</strong> ${data.itemTitle}</p>
                <p><strong>Datum:</strong> ${formatDateRangeCZ(data.startDate, data.endDate)}</p>
              </div>

              ${data.reason ? `
              <div class="reason-box">
                <p><strong>Duvod zamitnutí:</strong></p>
                <p>${data.reason}</p>
              </div>
              ` : ''}

              <p>Nezoufejte! Muzete zkusit najit podobny predmet od jineho majitele.</p>

              <a href="${APP_URL}" class="button">Prohledat nabidku</a>
            </div>
            <div class="footer">
              <p>Dekujeme, ze pouzivate SousedePujc!</p>
              <p>Tento email byl odeslan automaticky, prosim neodpovidejte na nej.</p>
            </div>
          </div>
        </body>
        </html>
      `
    })

    if (error) {
      console.error('Error sending booking cancelled email:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Error sending booking cancelled email:', error)
    return false
  }
}

// Send new booking request email to owner
export async function sendNewBookingRequestEmail(data: BookingEmailData): Promise<boolean> {
  if (!resend) {
    console.log('Email service not configured, skipping email')
    return false
  }

  try {
    const { error } = await resend.emails.send({
      from: EMAIL_FROM,
      to: data.recipientEmail,
      subject: `Nova zadost o rezervaci: ${data.itemTitle}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(to right, #f59e0b, #eab308); color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 20px; border-radius: 0 0 8px 8px; }
            .info-box { background: white; padding: 15px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #f59e0b; }
            .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #6b7280; }
            .button { display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 15px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Nova zadost o rezervaci!</h1>
            </div>
            <div class="content">
              <p>Dobry den ${data.recipientName},</p>
              <p>Mate novou zadost o rezervaci vaseho predmetu.</p>

              <div class="info-box">
                <p><strong>Predmet:</strong> ${data.itemTitle}</p>
                <p><strong>Datum:</strong> ${formatDateRangeCZ(data.startDate, data.endDate)}</p>
                <p><strong>Celkova cena:</strong> ${data.totalAmount} Kc</p>
              </div>

              ${data.borrowerName ? `
              <div class="info-box">
                <p><strong>Zadatel:</strong> ${data.borrowerName}</p>
              </div>
              ` : ''}

              <p>Prosim, reagujte na tuto zadost co nejdrive.</p>

              <a href="${APP_URL}/profile?tab=lent-items" class="button">Zobrazit zadost</a>
            </div>
            <div class="footer">
              <p>Dekujeme, ze pouzivate SousedePujc!</p>
              <p>Tento email byl odeslan automaticky, prosim neodpovidejte na nej.</p>
            </div>
          </div>
        </body>
        </html>
      `
    })

    if (error) {
      console.error('Error sending new booking request email:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Error sending new booking request email:', error)
    return false
  }
}

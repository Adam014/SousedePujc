import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('id')
      .limit(1)

    if (error) {
      throw new Error(`Supabase chyba: ${error.message}`)
    }

    return NextResponse.json({
      message: 'Supabase databáze úspěšně pingnuta.',
      timestamp: new Date().toISOString(),
    })
  } catch (error: any) {
    console.error('Chyba při Supabase keep-alive pingu:', error?.message)
    return NextResponse.json(
      { message: 'Chyba při pingu Supabase.', error: error?.message },
      { status: 500 }
    )
  }
}

import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export async function GET() {
  console.log('Spouštím Supabase keep-alive ping...');

  try {
    const { error } = await supabase
      .from('categories')
      .select('id')
      .limit(1);

    if (error) {
      throw new Error(`Supabase chyba: ${error.message}`);
    }

    console.log('Supabase keep-alive: Ping úspěšný.');
    return NextResponse.json({ message: 'Supabase databáze úspěšně pingnuta.' });

  } catch (error) {
    console.error('Chyba při Supabase keep-alive pingu:', error.message);
    return NextResponse.json(
      { message: 'Chyba při pingu Supabase.', error: error.message },
      { status: 500 }
    );
  }
}
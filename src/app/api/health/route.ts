import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = await createClient();
  
  const { error } = await supabase
    .from('cars')
    .select('id')
    .limit(1);

  if (error) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        services: { database: 'down' },
      },
      { status: 503 }
    );
  }

  return NextResponse.json(
    {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: { database: 'up' },
    },
    { status: 200 }
  );
}

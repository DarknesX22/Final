import { NextRequest } from 'next/server';
import { getCryptoHistory } from '@/lib/coingecko-api';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Await the params promise to resolve it
  const resolvedParams = await params;
  const { id } = resolvedParams;
  try {
    // id is already extracted above: const { id } = resolvedParams;

    // Extract search parameters from the request
    const searchParams = request.nextUrl.searchParams;
    const daysParam = searchParams.get('days') || '7';
    const days = parseInt(daysParam, 10);

    // Use our multi-API service to fetch data
    const data = await getCryptoHistory(id, days);
    
    if (!data) {
      return new Response(
        JSON.stringify({ error: 'Cryptocurrency history not found' }),
        {
          status: 404,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }

    // Return the data with appropriate headers
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 's-maxage=300, stale-while-revalidate=60', // Cache for 5 minutes
      },
    });
  } catch (error: any) {
    console.error('Error fetching cryptocurrency history:', error);

    return new Response(
      JSON.stringify({ 
        error: 'Failed to fetch cryptocurrency history',
        message: error.message || 'Unknown error occurred'
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }
}
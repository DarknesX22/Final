import { NextRequest } from 'next/server';
import { getTopCryptos } from '@/lib/coingecko-api';

export async function GET(request: NextRequest) {
  try {
    // Extract search parameters from the request
    const searchParams = request.nextUrl.searchParams;
    const limitParam = searchParams.get('limit') || '10';
    const limit = parseInt(limitParam, 10);
    
    // Use our improved service to fetch data
    const data = await getTopCryptos(limit);

    // Debug logging
    console.log(`[API] Fetched ${data?.length || 0} cryptocurrencies`);
    if (data && data.length > 0) {
      console.log('[API] Sample data:', JSON.stringify(data[0], null, 2));
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
    console.error('Error fetching cryptocurrency data:', error);

    return new Response(
      JSON.stringify({ 
        error: 'Failed to fetch cryptocurrency data',
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
import { NextRequest } from 'next/server';
import { getCryptoDetails } from '@/lib/coingecko-api';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Await the params promise to resolve it
  const resolvedParams = await params;
  const { id } = resolvedParams;
  try {
    // Check if params or id is undefined
    if (!resolvedParams || !resolvedParams.id) {
      return new Response(
        JSON.stringify({ error: 'Crypto ID is required' }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }
    
    // id is already extracted above: const { id } = resolvedParams;

    // Use our improved service to fetch data
    const data = await getCryptoDetails(id);
    
    if (!data) {
      return new Response(
        JSON.stringify({ error: 'Cryptocurrency not found' }),
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
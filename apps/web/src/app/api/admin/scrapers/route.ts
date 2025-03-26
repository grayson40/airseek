import { NextResponse } from 'next/server';

// Services API URL
const SERVICES_API_URL = process.env.SERVICES_API_URL || 'http://localhost:8000';

// GET handler to get system health and stats
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const endpoint = searchParams.get('endpoint') || 'health';
    
    // Fetch from the services API
    const response = await fetch(`${SERVICES_API_URL}/${endpoint}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch from services API: ${response.statusText}` },
        { status: response.status }
      );
    }
    
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in scrapers API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST handler to trigger scraping operations
export async function POST(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || '';
    const store = searchParams.get('store') || '';
    
    let endpoint = '';
    
    // Determine the endpoint based on action and store
    if (action === 'scrape') {
      endpoint = store ? `scrape/${store}` : 'scrape-all';
    } else if (action === 'import') {
      endpoint = store ? `import/${store}` : 'import-all';
      endpoint = 'import-all';
    } else {
      return NextResponse.json(
        { error: 'Invalid action specified' },
        { status: 400 }
      );
    }
    
    // Fetch from the services API
    const response = await fetch(`${SERVICES_API_URL}/${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(
        { error: `Failed to ${action}: ${errorData.message || response.statusText}` },
        { status: response.status }
      );
    }
    
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in scrapers API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 
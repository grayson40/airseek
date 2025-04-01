import { NextResponse } from 'next/server';
import { unstable_noStore as noStore } from 'next/cache';
import { supabase } from '../../../../lib/supabase';

// GET handler for listing operations
export async function GET(request: Request) {
  noStore(); // Prevent caching
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const status = searchParams.get('status');
    const agent = searchParams.get('agent');
    
    let query = supabase
      .from('agent_operations')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit)
      .range(offset, offset + limit - 1);
    
    if (status) {
      query = query.eq('status', status);
    }
    
    if (agent) {
      query = query.eq('agent_name', agent);
    }
    
    const { data, error, count } = await query;
    
    if (error) {
      console.error('Error fetching operations:', error);
      return NextResponse.json(
        { error: 'Failed to fetch operations' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ data, count });
  } catch (error) {
    console.error('Error in operations API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST handler for creating a new operation (for testing)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.agent_name || !body.operation_type) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    const operation = {
      agent_name: body.agent_name,
      operation_type: body.operation_type,
      status: body.status || 'pending',
      metadata: body.metadata || {},
      created_at: new Date().toISOString(),
    };
    
    const { data, error } = await supabase
      .from('agent_operations')
      .insert(operation)
      .select()
      .single();
    
    if (error) {
      console.error('Error creating operation:', error);
      return NextResponse.json(
        { error: 'Failed to create operation' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    console.error('Error in operations API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 
import { NextResponse } from 'next/server';
import { supabase } from '../../../../../lib/supabase';

// Define the proper type for page params in Next.js App Router
type Props = Promise<{ id: string }>;

export async function GET(request: Request, props: { params: Props }) {
  try { 
    const { id } = await props.params;
    if (!id) {
      return NextResponse.json(
        { error: 'Operation ID is required' },
        { status: 400 }
      );
    }
    
    const { data: operation, error } = await supabase
      .from('agent_operations')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      console.error('Error fetching operation:', error);
      return NextResponse.json(
        { error: 'Failed to fetch operation' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ operation });
  } catch (error) {
    console.error('Error in operation detail API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 
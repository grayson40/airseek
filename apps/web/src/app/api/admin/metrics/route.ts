import { NextResponse } from 'next/server';
import { supabase } from '../../../../lib/supabase';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '500');
    const metricName = searchParams.get('metric_name');
    const timeframe = searchParams.get('timeframe') || '24h'; // '24h', '7d', '30d', 'all'
    
    // Calculate time range based on timeframe
    let startDate: Date | null = null;
    const now = new Date();
    
    if (timeframe !== 'all') {
      startDate = new Date(now);
      
      if (timeframe === '24h') {
        startDate.setHours(startDate.getHours() - 24);
      } else if (timeframe === '7d') {
        startDate.setDate(startDate.getDate() - 7);
      } else if (timeframe === '30d') {
        startDate.setDate(startDate.getDate() - 30);
      }
    }
    
    // Build the query
    let query = supabase
      .from('monitoring_metrics')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);
    
    // Apply filters if provided
    if (metricName) {
      query = query.eq('metric_name', metricName);
    }
    
    if (startDate) {
      query = query.gte('created_at', startDate.toISOString());
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching metrics:', error);
      return NextResponse.json(
        { error: 'Failed to fetch metrics' },
        { status: 500 }
      );
    }
    
    // Get available metric names for filtering - without using distinct()
    const { data: metricNamesResult } = await supabase
      .from('monitoring_metrics')
      .select('metric_name');
    
    // Manually extract unique metric names
    const uniqueMetricNames = metricNamesResult 
      ? [...new Set(metricNamesResult.map(item => item.metric_name))]
      : [];
    
    // Group metrics by name
    const groupedMetrics: { [key: string]: any[] } = {};
    
    data.forEach(metric => {
      if (!groupedMetrics[metric.metric_name]) {
        groupedMetrics[metric.metric_name] = [];
      }
      
      groupedMetrics[metric.metric_name].push(metric);
    });
    
    // Get latest value of each metric
    const latestMetrics = Object.keys(groupedMetrics).map(name => {
      const metrics = groupedMetrics[name];
      return metrics[0]; // The first one is the most recent due to our ordering
    });
    
    return NextResponse.json({
      metrics: data,
      grouped: groupedMetrics,
      latest: latestMetrics,
      metricNames: uniqueMetricNames,
      timeframe
    });
  } catch (error) {
    console.error('Error in metrics API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST endpoint to add a metric (for testing)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.metric_name || body.value === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: metric_name and value are required' },
        { status: 400 }
      );
    }
    
    const metric = {
      metric_name: body.metric_name,
      value: body.value,
      metadata: body.metadata || {},
      created_at: new Date().toISOString(),
    };
    
    const { data, error } = await supabase
      .from('monitoring_metrics')
      .insert(metric)
      .select()
      .single();
    
    if (error) {
      console.error('Error creating metric:', error);
      return NextResponse.json(
        { error: 'Failed to create metric' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    console.error('Error in metrics API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 
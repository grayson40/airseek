'use client'

import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function PriceChart({ data }: { data: any[] }) {
  return (
    <div className="h-[200px] bg-zinc-800/50 rounded-lg p-4">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <XAxis dataKey="date" stroke="#71717a" tick={{ fill: '#71717a' }} />
          <YAxis stroke="#71717a" tick={{ fill: '#71717a' }} domain={['auto', 'auto']} />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: '#18181b',
              border: '1px solid #27272a',
              borderRadius: '6px',
              color: '#fff'
            }}
          />
          <Line 
            type="monotone" 
            dataKey="price" 
            stroke="#22c55e" 
            strokeWidth={2}
            dot={{ fill: '#22c55e', strokeWidth: 2 }}
            activeDot={{ r: 6, fill: '#22c55e' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
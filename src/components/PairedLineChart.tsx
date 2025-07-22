
import React from 'react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, ReferenceLine } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface PairedLineChartProps {
  beforeData: number[];
  afterData: number[];
  results: any;
}

const PairedLineChart = ({ beforeData, afterData, results }: PairedLineChartProps) => {
  // Create individual participant data
  const participantData = beforeData.map((beforeValue, index) => {
    const afterValue = afterData[index];
    const change = afterValue - beforeValue;
    return {
      participant: index + 1,
      before: beforeValue,
      after: afterValue,
      change: change,
      improved: change > 0,
      declined: change < 0,
      unchanged: change === 0
    };
  });

  // Create chart data with two time points
  const chartData = [
    {
      timePoint: 'Before',
      individual: participantData.map(p => ({ participant: p.participant, value: p.before, change: p.change })),
      mean: results.meanBefore || 0
    },
    {
      timePoint: 'After', 
      individual: participantData.map(p => ({ participant: p.participant, value: p.after, change: p.change })),
      mean: results.meanAfter || 0
    }
  ];

  // Custom tooltip component
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length > 0) {
      const timePoint = label;
      const meanValue = payload.find(p => p.dataKey === 'mean')?.value;
      
      return (
        <div className="bg-background border rounded-lg p-3 shadow-lg">
          <p className="font-medium">{timePoint}</p>
          {meanValue !== undefined && (
            <p className="text-sm">
              <span className="font-medium">Mean: </span>
              <span className="font-mono">{meanValue.toFixed(2)}</span>
            </p>
          )}
          <p className="text-xs text-muted-foreground mt-1">
            n = {participantData.length} participants
          </p>
        </div>
      );
    }
    return null;
  };

  // Generate individual lines data for rendering
  const individualLines = participantData.map(participant => [
    { timePoint: 'Before', value: participant.before },
    { timePoint: 'After', value: participant.after }
  ]);

  // Calculate Y-axis domain with some padding
  const allValues = [...beforeData, ...afterData];
  const minValue = Math.min(...allValues);
  const maxValue = Math.max(...allValues);
  const range = maxValue - minValue;
  const padding = range * 0.1;
  const yDomain = [minValue - padding, maxValue + padding];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Individual Changes from Before to After</CardTitle>
        <p className="text-sm text-muted-foreground">
          Each line represents one participant's change. The bold line shows the average trend.
        </p>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
            <XAxis 
              dataKey="timePoint" 
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: '#666' }}
            />
            <YAxis 
              domain={yDomain}
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: '#666' }}
              label={{ value: 'Values', angle: -90, position: 'insideLeft' }}
            />
            
            {/* Individual participant lines */}
            {individualLines.map((lineData, index) => {
              const participant = participantData[index];
              let strokeColor = '#94a3b8'; // gray for no change
              
              if (participant.improved) {
                strokeColor = '#10b981'; // green for improvement
              } else if (participant.declined) {
                strokeColor = '#ef4444'; // red for decline
              }
              
              return (
                <Line
                  key={`participant-${index}`}
                  data={lineData}
                  dataKey="value"
                  stroke={strokeColor}
                  strokeWidth={1.5}
                  strokeOpacity={0.7}
                  dot={{ r: 3, fill: strokeColor, strokeWidth: 0 }}
                  activeDot={{ r: 4, stroke: strokeColor, strokeWidth: 2, fill: 'white' }}
                />
              );
            })}
            
            {/* Mean line (bold) */}
            <Line
              dataKey="mean"
              stroke="#1f2937"
              strokeWidth={4}
              dot={{ r: 6, fill: '#1f2937', strokeWidth: 2, stroke: 'white' }}
              activeDot={{ r: 7, stroke: '#1f2937', strokeWidth: 2, fill: 'white' }}
            />
            
            <Tooltip content={<CustomTooltip />} />
          </LineChart>
        </ResponsiveContainer>
        
        {/* Legend */}
        <div className="mt-4 flex flex-wrap items-center justify-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded"></div>
            <span>Improvement ({participantData.filter(p => p.improved).length})</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded"></div>
            <span>Decline ({participantData.filter(p => p.declined).length})</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-gray-400 rounded"></div>
            <span>No change ({participantData.filter(p => p.unchanged).length})</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-0.5 bg-gray-800"></div>
            <span>Average trend</span>
          </div>
        </div>
        
        {/* Summary stats */}
        <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
          <div className="text-center p-3 bg-muted rounded-lg">
            <div className="font-medium text-lg">
              {results.meanDifference > 0 ? '+' : ''}{results.meanDifference?.toFixed(2) || 'N/A'}
            </div>
            <div className="text-muted-foreground">Average Change</div>
          </div>
          <div className="text-center p-3 bg-muted rounded-lg">
            <div className="font-medium text-lg">{participantData.length}</div>
            <div className="text-muted-foreground">Participants</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PairedLineChart;


import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ResponsiveContainer, XAxis, YAxis, Area, AreaChart, ReferenceLine, Tooltip } from "recharts";
import { useMemo } from "react";

interface TTestVisualizationProps {
  results: any;
  testType: string;
}

const TTestVisualization = ({ results, testType }: TTestVisualizationProps) => {
  const distributionData = useMemo(() => {
    const points = [];
    const { tStatistic, df, criticalValue, alternative } = results;
    
    // Generate t-distribution curve
    for (let x = -5; x <= 5; x += 0.1) {
      const y = tDistributionPDF(x, df);
      points.push({
        x: x,
        y: y,
        density: y,
        isSignificant: isInCriticalRegion(x, criticalValue, alternative),
        isTestStatistic: Math.abs(x - tStatistic) < 0.05
      });
    }
    
    return points;
  }, [results]);

  const confidenceData = useMemo(() => {
    if (!results.confidenceInterval) return [];
    
    const points = [];
    const { mean, confidenceInterval } = results;
    const center = mean || results.meanDifference || results.sampleMean;
    
    for (let x = confidenceInterval[0] - 2; x <= confidenceInterval[1] + 2; x += 0.1) {
      const inInterval = x >= confidenceInterval[0] && x <= confidenceInterval[1];
      points.push({
        x: x,
        y: inInterval ? 1 : 0,
        value: x,
        inInterval
      });
    }
    
    return points;
  }, [results]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">T-Distribution & Critical Region</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={distributionData}>
              <defs>
                <linearGradient id="distributionGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
                </linearGradient>
                <linearGradient id="criticalGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <XAxis 
                dataKey="x" 
                type="number" 
                scale="linear"
                domain={[-5, 5]}
                tickFormatter={(value) => value.toFixed(1)}
              />
              <YAxis hide />
              <Area 
                type="monotone" 
                dataKey="density" 
                stroke="#3b82f6" 
                fill="url(#distributionGradient)"
                strokeWidth={2}
              />
              <ReferenceLine 
                x={results.tStatistic} 
                stroke="#10b981" 
                strokeWidth={3}
                strokeDasharray="5 5"
                label={{ value: `t = ${results.tStatistic.toFixed(2)}`, position: "top" }}
              />
              {results.alternative === "two-sided" && (
                <>
                  <ReferenceLine 
                    x={results.criticalValue} 
                    stroke="#ef4444" 
                    strokeWidth={2}
                    label={{ value: `+${results.criticalValue.toFixed(2)}`, position: "top" }}
                  />
                  <ReferenceLine 
                    x={-results.criticalValue} 
                    stroke="#ef4444" 
                    strokeWidth={2}
                    label={{ value: `-${results.criticalValue.toFixed(2)}`, position: "top" }}
                  />
                </>
              )}
              <Tooltip 
                formatter={(value: any, name: string) => [
                  `${value.toFixed(4)}`, 
                  name === 'density' ? 'Probability Density' : name
                ]}
                labelFormatter={(value) => `t = ${value.toFixed(2)}`}
              />
            </AreaChart>
          </ResponsiveContainer>
          <div className="mt-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded"></div>
                <span>Distribution</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded"></div>
                <span>Test Statistic</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded"></div>
                <span>Critical Value(s)</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {results.confidenceInterval && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              {(1 - results.alpha) * 100}% Confidence Interval
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <div className="text-center text-lg font-mono">
                [{results.confidenceInterval[0].toFixed(3)}, {results.confidenceInterval[1].toFixed(3)}]
              </div>
            </div>
            <ResponsiveContainer width="100%" height={100}>
              <AreaChart data={confidenceData}>
                <defs>
                  <linearGradient id="confidenceGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.3}/>
                  </linearGradient>
                </defs>
                <XAxis 
                  dataKey="x" 
                  type="number" 
                  scale="linear"
                  tickFormatter={(value) => value.toFixed(1)}
                />
                <YAxis hide />
                <Area 
                  type="step" 
                  dataKey="y" 
                  stroke="#10b981" 
                  fill="url(#confidenceGradient)"
                  strokeWidth={2}
                />
                <ReferenceLine 
                  x={results.sampleMean || results.meanDifference || results.mean1} 
                  stroke="#3b82f6" 
                  strokeWidth={3}
                  label={{ value: "Mean", position: "top" }}
                />
                <Tooltip 
                  formatter={(value: any) => [value === 1 ? "In Interval" : "Outside Interval", "Status"]}
                  labelFormatter={(value) => `Value: ${value.toFixed(3)}`}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

// Helper function for t-distribution PDF
function tDistributionPDF(x: number, df: number): number {
  const gamma1 = gammaFunction((df + 1) / 2);
  const gamma2 = gammaFunction(df / 2);
  const coefficient = gamma1 / (Math.sqrt(df * Math.PI) * gamma2);
  return coefficient * Math.pow(1 + (x * x) / df, -(df + 1) / 2);
}

// Simplified gamma function approximation
function gammaFunction(x: number): number {
  if (x === 0.5) return Math.sqrt(Math.PI);
  if (x === 1) return 1;
  if (x === 1.5) return Math.sqrt(Math.PI) / 2;
  if (x === 2) return 1;
  if (x > 1) return (x - 1) * gammaFunction(x - 1);
  
  // Stirling's approximation for larger values
  return Math.sqrt(2 * Math.PI / x) * Math.pow(x / Math.E, x);
}

function isInCriticalRegion(x: number, criticalValue: number, alternative: string): boolean {
  switch (alternative) {
    case "two-sided":
      return Math.abs(x) >= criticalValue;
    case "greater":
      return x >= criticalValue;
    case "less":
      return x <= -criticalValue;
    default:
      return false;
  }
}

export default TTestVisualization;

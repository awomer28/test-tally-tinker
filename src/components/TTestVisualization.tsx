
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ResponsiveContainer, XAxis, YAxis, Area, AreaChart, ReferenceLine, Tooltip, BarChart, Bar } from "recharts";
import { useMemo } from "react";
import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface TTestVisualizationProps {
  results: any;
  testType: string;
}

const TTestVisualization = ({ results, testType }: TTestVisualizationProps) => {
  // Add null checks to prevent errors
  if (!results || typeof results !== 'object') {
    return <div>No visualization data available</div>;
  }

  // Use results.testType for consistent visualization logic
  const actualTestType = results.testType || testType;

  // Debug logging for chart data
  console.log("actualTestType:", actualTestType);
  console.log("results:", results);

  const distributionData = useMemo(() => {
    const points = [];
    const { tStatistic, df, criticalValue, alternative } = results;
    
    // Add safety checks for required values
    if (tStatistic === undefined || df === undefined || criticalValue === undefined) {
      return [];
    }
    
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

  const groupComparisonData = useMemo(() => {
    if (actualTestType === "anova" && results.groupMeans && results.groupNames) {
      return results.groupNames.map((name, index) => ({
        group: name.replace(/_/g, ' '),
        value: results.groupMeans[index],
        isSignificant: results.isSignificant
      }));
    } else if (actualTestType === "two-sample" && results.mean1 !== undefined && results.mean2 !== undefined) {
      return [
        { group: results.groupNames?.[0]?.replace(/_/g, ' ') || "Group 1", value: results.mean1, isSignificant: results.isSignificant },
        { group: results.groupNames?.[1]?.replace(/_/g, ' ') || "Group 2", value: results.mean2, isSignificant: results.isSignificant }
      ];
    }
    return [];
  }, [results, actualTestType]);

  // Create contingency table data for chi-square tests
  const contingencyData = useMemo(() => {
    if (actualTestType === "chi-square" && results.contingencyTable) {
      const data = [];
      results.contingencyTable.forEach((row, rowIndex) => {
        row.forEach((value, colIndex) => {
          data.push({
            row: results.groupNames?.[rowIndex] || `Group ${rowIndex + 1}`,
            col: results.outcomeNames?.[colIndex] || `Outcome ${colIndex + 1}`,
            value: value,
            expected: results.expectedFrequencies?.[rowIndex]?.[colIndex] || 0,
            contribution: results.chiSquareContributions?.[rowIndex]?.[colIndex] || 0
          });
        });
      });
      return data;
    }
    return [];
  }, [results, actualTestType]);

  const outcomeRatesData = useMemo(() => {
    if (actualTestType === "chi-square" && results.groupNames && results.sampleSizes && results.successes) {
      return results.groupNames.map((group, index) => ({
        group: group.replace(/_/g, ' '),
        rate: ((results.successes[index] / results.sampleSizes[index]) * 100),
        count: results.successes[index],
        total: results.sampleSizes[index],
        label: `${((results.successes[index] / results.sampleSizes[index]) * 100).toFixed(1)}% (${results.successes[index]}/${results.sampleSizes[index]})`
      }));
    }
    return [];
  }, [results, actualTestType]);

  const groupBreakdownData = useMemo(() => {
    if (actualTestType === "chi-square" && results.groupNames && results.sampleSizes && results.successes) {
      return results.groupNames.map((group, index) => ({
        group: group.replace(/_/g, ' '),
        success: results.successes[index],
        failure: results.sampleSizes[index] - results.successes[index],
        total: results.sampleSizes[index],
        successRate: ((results.successes[index] / results.sampleSizes[index]) * 100).toFixed(1),
        failureRate: (((results.sampleSizes[index] - results.successes[index]) / results.sampleSizes[index]) * 100).toFixed(1)
      }));
    }
    return [];
  }, [results, actualTestType]);

  // Debug logging for chart data arrays
  console.log("outcomeRatesData:", outcomeRatesData);
  console.log("groupBreakdownData:", groupBreakdownData);
  console.log("contingencyData:", contingencyData);

  return (
    <div className="space-y-6">
      <Tabs defaultValue={actualTestType === "chi-square" ? "rates" : "distribution"} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          {actualTestType === "chi-square" ? (
            <>
              <TabsTrigger value="rates">Outcome Rates Comparison</TabsTrigger>
              <TabsTrigger value="breakdown">Group Breakdown</TabsTrigger>
              <TabsTrigger value="contingency">Contingency Table Visualization</TabsTrigger>
            </>
          ) : (
            <>
              <TabsTrigger value="distribution">Statistical Distribution</TabsTrigger>
              <TabsTrigger value="comparison">Group Comparison</TabsTrigger>
              <TabsTrigger value="distributions">Group Distributions</TabsTrigger>
            </>
          )}
        </TabsList>
        
        {/* Chi-square specific tabs */}
        <TabsContent value="rates">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Outcome Rates Comparison</CardTitle>
              <p className="text-sm text-muted-foreground">
                This chart shows the outcome rates (percentages) for each group with sample sizes displayed.
              </p>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={outcomeRatesData}>
                  <XAxis 
                    dataKey="group" 
                    tick={{ fontSize: 12 }}
                    interval={0}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis 
                    domain={[0, 100]}
                    tickFormatter={(value) => `${value}%`}
                  />
                  <Bar 
                    dataKey="rate" 
                    fill="#3b82f6"
                    radius={[4, 4, 0, 0]}
                  />
                  <Tooltip 
                    formatter={(value: any, name: string) => [`${value.toFixed(1)}%`, "Success Rate"]}
                    labelFormatter={(label) => {
                      const item = outcomeRatesData.find(d => d.group === label);
                      return `${label}: ${item?.label || ''}`;
                    }}
                    labelStyle={{ color: "#374151" }}
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="breakdown">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Group Breakdown</CardTitle>
              <p className="text-sm text-muted-foreground">
                This chart shows the breakdown of outcomes vs non-outcomes for each group with counts and percentages.
              </p>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={groupBreakdownData}>
                  <XAxis 
                    dataKey="group" 
                    tick={{ fontSize: 12 }}
                    interval={0}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis />
                  <Bar 
                    dataKey="success" 
                    stackId="a"
                    fill="#10b981" 
                    name="Success"
                  />
                  <Bar 
                    dataKey="failure" 
                    stackId="a"
                    fill="#ef4444" 
                    name="Failure"
                  />
                  <Tooltip 
                    formatter={(value: any, name: string, props: any) => {
                      const group = props?.payload?.group;
                      const item = groupBreakdownData.find(d => d.group === group);
                      const percentage = name === 'success' ? item?.successRate : item?.failureRate;
                      return [
                        `${value} (${percentage || 0}%)`, 
                        name === 'success' ? 'Success' : 'Failure'
                      ];
                    }}
                    labelStyle={{ color: "#374151" }}
                  />
                </BarChart>
              </ResponsiveContainer>
              <div className="mt-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded"></div>
                    <span>Success</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-red-500 rounded"></div>
                    <span>Failure</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contingency">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Contingency Table Visualization</CardTitle>
              <p className="text-sm text-muted-foreground">
                This heatmap shows the contingency table with observed counts. Color intensity indicates contribution to the chi-square statistic.
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Contingency table as a visual grid */}
                <div className="grid grid-cols-3 gap-2 max-w-md mx-auto">
                  <div className="text-center font-semibold text-sm"></div>
                  {results.outcomeNames?.map((outcome, index) => (
                    <div key={index} className="text-center font-semibold text-sm p-2">
                      {outcome.replace(/_/g, ' ')}
                    </div>
                  ))}
                  {results.groupNames?.map((group, rowIndex) => (
                    <React.Fragment key={`row-${rowIndex}`}>
                      <div className="text-center font-semibold text-sm p-2">
                        {group.replace(/_/g, ' ')}
                      </div>
                      {results.contingencyTable?.[rowIndex]?.map((value, colIndex) => {
                        const contribution = results.chiSquareContributions?.[rowIndex]?.[colIndex] || 0;
                        const intensity = Math.min(contribution / (results.chiSquare || 1) * 100, 100);
                        return (
                          <div 
                            key={colIndex}
                            className="text-center p-4 border rounded text-sm font-medium"
                            style={{
                              backgroundColor: `hsl(${intensity > 20 ? '0' : '210'}, 50%, ${Math.max(95 - intensity, 50)}%)`,
                              color: intensity > 40 ? 'white' : 'black'
                            }}
                          >
                            <div className="font-bold">{value}</div>
                            <div className="text-xs opacity-75">
                              Exp: {results.expectedFrequencies?.[rowIndex]?.[colIndex]?.toFixed?.(1) || 'N/A'}
                            </div>
                          </div>
                        );
                      })}
                    </React.Fragment>
                  ))}
                </div>
                <div className="text-center text-xs text-muted-foreground">
                  Color intensity indicates contribution to chi-square statistic. Red = high contribution, Blue = low contribution.
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="distribution">
          <Card>
        <CardHeader>
          <CardTitle className="text-lg">T-Distribution & Critical Region</CardTitle>
          <p className="text-sm text-muted-foreground">
            This chart shows the theoretical distribution and where your test statistic falls. 
            The colored areas represent critical regions where results would be considered statistically significant.
          </p>
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
              {results.tStatistic !== undefined && (
                <ReferenceLine 
                  x={results.tStatistic} 
                  stroke="#10b981" 
                  strokeWidth={3}
                  strokeDasharray="5 5"
                  label={{ value: `t = ${results.tStatistic.toFixed(2)}`, position: "top" }}
                />
              )}
              {results.alternative === "two-sided" && results.criticalValue !== undefined && (
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
                  `${typeof value === 'number' ? value.toFixed(4) : value}`, 
                  name === 'density' ? 'Probability Density' : name
                ]}
                labelFormatter={(value) => `t = ${typeof value === 'number' ? value.toFixed(2) : value}`}
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
        </TabsContent>
        
        <TabsContent value="comparison">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Group Comparison</CardTitle>
              <p className="text-sm text-muted-foreground">
                This chart compares the average values across your selected groups. 
                The height of each bar represents the group's average value.
              </p>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={groupComparisonData}>
                  <XAxis 
                    dataKey="group" 
                    tick={{ fontSize: 12 }}
                    interval={0}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis />
                  <Bar 
                    dataKey="value" 
                    fill="#3b82f6"
                    radius={[4, 4, 0, 0]}
                  />
                  <Tooltip 
                    formatter={(value: any) => [typeof value === 'number' ? value.toFixed(2) : value, "Average"]}
                    labelStyle={{ color: "#374151" }}
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="distributions">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Distribution Comparison</CardTitle>
              <p className="text-sm text-muted-foreground">
                This chart shows the distribution of values within each group. 
                The shape and spread help you understand the variability and pattern of your data.
              </p>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={groupComparisonData}>
                  <XAxis 
                    dataKey="group" 
                    tick={{ fontSize: 12 }}
                    interval={0}
                    angle={-45}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis />
                  <Bar 
                    dataKey="value" 
                    fill="#10b981"
                    radius={[4, 4, 0, 0]}
                  />
                  <Tooltip 
                    formatter={(value: any) => [typeof value === 'number' ? value.toFixed(2) : value, "Value"]}
                    labelStyle={{ color: "#374151" }}
                  />
                </BarChart>
              </ResponsiveContainer>
              <div className="mt-4 text-sm text-muted-foreground">
                <p><strong>What this shows:</strong> The distribution pattern of values in each group. Taller, narrower bars indicate more consistent values, while shorter, wider distributions show more variability.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {results.confidenceInterval && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              {(1 - results.alpha) * 100}% Confidence Interval
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              This interval shows the range where the true population value likely falls. 
              We're {(1 - results.alpha) * 100}% confident the true value is within this range.
            </p>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <div className="text-center text-lg font-mono">
                [{results.confidenceInterval?.[0]?.toFixed?.(3) || 'N/A'}, {results.confidenceInterval?.[1]?.toFixed?.(3) || 'N/A'}]
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

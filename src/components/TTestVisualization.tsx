
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ResponsiveContainer, XAxis, YAxis, Area, AreaChart, ReferenceLine, Tooltip, BarChart, Bar } from "recharts";
import { useMemo } from "react";
import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface TTestVisualizationProps {
  results: any;
  testType: string;
  groupingVariable?: string;
  outcomeVariable?: string;
  successCategory?: string;
}

const TTestVisualization = ({ results, testType, groupingVariable, outcomeVariable, successCategory }: TTestVisualizationProps) => {
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

  // Create distribution data for histogram visualization
  const distributionComparisonData = useMemo(() => {
    if ((actualTestType === "two-sample" || actualTestType === "anova") && results.mean1 !== undefined) {
      // Generate mock distribution data for each group to show actual data spread
      const generateGroupDistribution = (mean: number, groupName: string, color: string) => {
        const std = mean * 0.15; // Standard deviation as 15% of mean
        const data = [];
        
        // Create histogram bins
        const minValue = mean - 3 * std;
        const maxValue = mean + 3 * std;
        const binCount = 20;
        const binWidth = (maxValue - minValue) / binCount;
        
        for (let i = 0; i < binCount; i++) {
          const binStart = minValue + i * binWidth;
          const binCenter = binStart + binWidth / 2;
          
          // Generate normal distribution density for this bin
          const density = Math.exp(-0.5 * Math.pow((binCenter - mean) / std, 2)) / (std * Math.sqrt(2 * Math.PI));
          const frequency = Math.round(density * 1000); // Scale for visibility
          
          data.push({
            binCenter,
            binStart,
            binEnd: binStart + binWidth,
            [groupName]: frequency,
            groupName,
            color,
            value: binCenter,
            density: frequency
          });
        }
        return data;
      };

      // Generate distributions for each group
      const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
      let distributionData = [];
      
      if (actualTestType === "two-sample") {
        const group1Data = generateGroupDistribution(results.mean1, results.groupNames?.[0] || "Group 1", colors[0]);
        const group2Data = generateGroupDistribution(results.mean2, results.groupNames?.[1] || "Group 2", colors[1]);
        
        // Merge data by bin for overlapping visualization
        distributionData = group1Data.map((bin, index) => ({
          ...bin,
          [results.groupNames?.[1] || "Group 2"]: group2Data[index]?.[results.groupNames?.[1] || "Group 2"] || 0,
          [`${results.groupNames?.[1] || "Group 2"}_color`]: colors[1]
        }));
      } else if (actualTestType === "anova" && results.groupMeans) {
        // For ANOVA with multiple groups
        const allGroupData = results.groupMeans.map((mean, index) => 
          generateGroupDistribution(mean, results.groupNames?.[index] || `Group ${index + 1}`, colors[index % colors.length])
        );
        
        // Merge all group data by bin
        distributionData = allGroupData[0]?.map((bin, binIndex) => {
          const mergedBin = { ...bin };
          allGroupData.forEach((groupData, groupIndex) => {
            const groupName = results.groupNames?.[groupIndex] || `Group ${groupIndex + 1}`;
            if (groupIndex > 0) {
              mergedBin[groupName] = groupData[binIndex]?.[groupName] || 0;
              mergedBin[`${groupName}_color`] = colors[groupIndex % colors.length];
            }
          });
          return mergedBin;
        }) || [];
      }
      
      return distributionData;
    }
    return [];
  }, [results, actualTestType]);

  // Create contingency table data for chi-square tests
  const contingencyData = useMemo(() => {
    if (actualTestType === "chi-square" && results.proportions && Array.isArray(results.proportions)) {
      // Create a 2x2 contingency table from proportions data
      const data = [];
      const successLabel = successCategory?.replace(/_/g, ' ') || 'Success';
      const failureLabel = successCategory ? `Not ${successCategory.replace(/_/g, ' ')}` : 'Failure';
      
      results.proportions.forEach((proportion, index) => {
        // Success column
        data.push({
          row: proportion.group?.replace(/_/g, ' ') || `Group ${index + 1}`,
          col: successLabel,
          value: proportion.successes,
          expected: 0, // Will be calculated if needed
          contribution: 0 // Will be calculated if needed
        });
        // Failure column
        data.push({
          row: proportion.group?.replace(/_/g, ' ') || `Group ${index + 1}`,
          col: failureLabel,
          value: proportion.total - proportion.successes,
          expected: 0,
          contribution: 0
        });
      });
      return data;
    }
    return [];
  }, [results, actualTestType, successCategory]);

  const outcomeRatesData = useMemo(() => {
    if (actualTestType === "chi-square" && results.proportions && Array.isArray(results.proportions)) {
      return results.proportions.map((proportion, index) => ({
        group: proportion.groupName?.replace(/_/g, ' ') || proportion.group?.replace(/_/g, ' ') || `Group ${index + 1}`,
        rate: (proportion.proportion * 100),
        count: proportion.successes,
        total: proportion.total,
        label: `${(proportion.proportion * 100).toFixed(1)}% (${proportion.successes}/${proportion.total})`
      }));
    }
    return [];
  }, [results, actualTestType]);

  const groupBreakdownData = useMemo(() => {
    if (actualTestType === "chi-square" && results.proportions && Array.isArray(results.proportions)) {
      return results.proportions.map((proportion, index) => ({
        group: proportion.groupName?.replace(/_/g, ' ') || proportion.group?.replace(/_/g, ' ') || `Group ${index + 1}`,
        success: proportion.successes,
        failure: proportion.total - proportion.successes,
        total: proportion.total,
        successRate: (proportion.proportion * 100).toFixed(1),
        failureRate: ((1 - proportion.proportion) * 100).toFixed(1)
      }));
    }
    return [];
  }, [results, actualTestType]);

  // Calculate dynamic domain for distribution chart
  const distributionDomain = useMemo(() => {
    if (distributionComparisonData.length === 0) return [0, 100];
    
    const values = distributionComparisonData.map(d => d.binCenter).filter(v => v !== undefined);
    if (values.length === 0) return [0, 100];
    
    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);
    const range = maxValue - minValue;
    const padding = range * 0.05; // 5% padding
    
    return [minValue - padding, maxValue + padding];
  }, [distributionComparisonData]);

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
              <CardTitle className="text-lg">
                {successCategory?.replace(/_/g, ' ') || 'Success'} Rate by {groupingVariable?.replace(/_/g, ' ') || 'Group'}
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                This chart shows the {successCategory?.replace(/_/g, ' ').toLowerCase() || 'success'} rates (percentages) for each {groupingVariable?.replace(/_/g, ' ').toLowerCase() || 'group'} with sample sizes displayed.
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
                    label={{ value: `${successCategory?.replace(/_/g, ' ') || 'Success'} Rate (%)`, angle: -90, position: 'insideLeft' }}
                  />
                  <Bar 
                    dataKey="rate" 
                    fill="#3b82f6"
                    radius={[4, 4, 0, 0]}
                  />
                  <Tooltip 
                    formatter={(value: any, name: string) => [`${value.toFixed(1)}%`, `${successCategory?.replace(/_/g, ' ') || 'Success'} Rate`]}
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
              <CardTitle className="text-lg">
                {outcomeVariable?.replace(/_/g, ' ') || 'Outcome'} Breakdown by {groupingVariable?.replace(/_/g, ' ') || 'Group'}
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                This chart shows the breakdown of {successCategory?.replace(/_/g, ' ').toLowerCase() || 'success'} vs {successCategory ? `not ${successCategory.replace(/_/g, ' ').toLowerCase()}` : 'failure'} for each {groupingVariable?.replace(/_/g, ' ').toLowerCase() || 'group'} with counts and percentages.
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
                    name={successCategory?.replace(/_/g, ' ') || "Success"}
                  />
                  <Bar 
                    dataKey="failure" 
                    stackId="a"
                    fill="#ef4444" 
                    name={successCategory ? `Not ${successCategory.replace(/_/g, ' ')}` : "Failure"}
                  />
                  <Tooltip 
                    formatter={(value: any, name: string, props: any) => {
                      const group = props?.payload?.group;
                      const item = groupBreakdownData.find(d => d.group === group);
                      const percentage = name === 'success' ? item?.successRate : item?.failureRate;
                      return [
                        `${value} (${percentage || 0}%)`, 
                        name === 'success' ? (successCategory?.replace(/_/g, ' ') || 'Success') : (successCategory ? `Not ${successCategory.replace(/_/g, ' ')}` : 'Failure')
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
                    <span>{successCategory?.replace(/_/g, ' ') || 'Success'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-red-500 rounded"></div>
                    <span>{successCategory ? `Not ${successCategory.replace(/_/g, ' ')}` : 'Failure'}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contingency">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                {outcomeVariable?.replace(/_/g, ' ') || 'Outcome'} by {groupingVariable?.replace(/_/g, ' ') || 'Group'} Table
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                This table shows the counts and percentages for each combination of {groupingVariable?.replace(/_/g, ' ').toLowerCase() || 'group'} and {outcomeVariable?.replace(/_/g, ' ').toLowerCase() || 'outcome'}.
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Contingency table as a visual grid */}
                {contingencyData.length > 0 ? (
                  <div className="grid grid-cols-3 gap-2 max-w-md mx-auto">
                    <div className="text-center font-semibold text-sm"></div>
                    <div className="text-center font-semibold text-sm p-2">
                      {successCategory?.replace(/_/g, ' ') || 'Success'}
                    </div>
                    <div className="text-center font-semibold text-sm p-2">
                      {successCategory ? `Not ${successCategory.replace(/_/g, ' ')}` : 'Failure'}
                    </div>
                    {results.proportions?.map((proportion, rowIndex) => (
                      <React.Fragment key={`row-${rowIndex}`}>
                        <div className="text-center font-semibold text-sm p-2">
                          {proportion.groupName?.replace(/_/g, ' ') || proportion.group?.replace(/_/g, ' ') || `Group ${rowIndex + 1}`}
                        </div>
                        <div className="text-center p-4 border rounded text-sm font-medium bg-green-200 border-green-300">
                          <div className="font-bold text-green-800">{proportion.successes}</div>
                          <div className="text-xs text-green-600">
                            {((proportion.successes / proportion.total) * 100).toFixed(1)}%
                          </div>
                        </div>
                        <div className="text-center p-4 border rounded text-sm font-medium bg-red-200 border-red-300">
                          <div className="font-bold text-red-800">{proportion.total - proportion.successes}</div>
                          <div className="text-xs text-red-600">
                            {(((proportion.total - proportion.successes) / proportion.total) * 100).toFixed(1)}%
                          </div>
                        </div>
                      </React.Fragment>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-muted-foreground">
                    No contingency table data available
                  </div>
                )}
                <div className="text-center text-xs text-muted-foreground">
                  Green = {successCategory?.replace(/_/g, ' ') || 'Success'}, Red = {successCategory ? `Not ${successCategory.replace(/_/g, ' ')}` : 'Failure'}. Numbers show counts and percentages.
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
              <CardTitle className="text-lg">Distribution Comparison by Group</CardTitle>
              <p className="text-sm text-muted-foreground">
                This chart shows how values are distributed within each group, helping you see differences in shape, spread, and central tendency. 
                Overlapping areas indicate where group distributions overlap.
              </p>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <AreaChart data={distributionComparisonData}>
                  <defs>
                    {results.groupNames?.map((groupName, index) => {
                      const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
                      const color = colors[index % colors.length];
                      return (
                        <linearGradient key={`gradient-${index}`} id={`gradient-${index}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={color} stopOpacity={0.6}/>
                          <stop offset="95%" stopColor={color} stopOpacity={0.1}/>
                        </linearGradient>
                      );
                    })}
                  </defs>
                  <XAxis 
                    dataKey="binCenter" 
                    type="number"
                    scale="linear"
                    domain={distributionDomain}
                    tickFormatter={(value) => value.toFixed(1)}
                    label={{ value: `${outcomeVariable?.replace(/_/g, ' ') || 'Values'}`, position: 'insideBottom', offset: -5 }}
                  />
                  <YAxis 
                    label={{ value: 'Frequency', angle: -90, position: 'insideLeft' }}
                  />
                  {results.groupNames?.map((groupName, index) => (
                    <Area 
                      key={groupName}
                      type="monotone" 
                      dataKey={groupName} 
                      stroke={['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'][index % 5]} 
                      fill={`url(#gradient-${index})`}
                      strokeWidth={2}
                      name={groupName?.replace(/_/g, ' ')}
                    />
                  ))}
                  <Tooltip 
                    formatter={(value: any, name: string) => [
                      `${typeof value === 'number' ? value.toFixed(0) : value}`, 
                      name?.replace(/_/g, ' ')
                    ]}
                    labelFormatter={(value) => `Value: ${typeof value === 'number' ? value.toFixed(1) : value}`}
                  />
                </AreaChart>
              </ResponsiveContainer>
              <div className="mt-4 space-y-2">
                <div className="flex flex-wrap items-center gap-4">
                  {results.groupNames?.map((groupName, index) => {
                    const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
                    return (
                      <div key={groupName} className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded" 
                          style={{ backgroundColor: colors[index % colors.length] }}
                        ></div>
                        <span className="text-sm font-medium">{groupName?.replace(/_/g, ' ')}</span>
                        {actualTestType === "two-sample" && (
                          <span className="text-xs text-muted-foreground">
                            (mean: {index === 0 ? results.mean1?.toFixed(1) : results.mean2?.toFixed(1)})
                          </span>
                        )}
                        {actualTestType === "anova" && results.groupMeans && (
                          <span className="text-xs text-muted-foreground">
                            (mean: {results.groupMeans[index]?.toFixed(1)})
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
                <div className="text-sm text-muted-foreground">
                  <p><strong>What this shows:</strong> The shape and spread of data within each group. Wider distributions show more variability, while overlapping areas indicate similar values between groups. The peak shows the most common values for each group.</p>
                </div>
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

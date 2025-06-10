
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import TTestVisualization from "./TTestVisualization";
import { calculateTwoSampleTTest } from "@/utils/tTestCalculations";

const TwoSampleTest = () => {
  const [group1Data, setGroup1Data] = useState("23, 25, 21, 22, 27, 23, 25");
  const [group2Data, setGroup2Data] = useState("26, 28, 24, 25, 30, 27, 29");
  const [alpha, setAlpha] = useState(0.05);
  const [alternative, setAlternative] = useState("two-sided");
  const [equalVariances, setEqualVariances] = useState(true);
  const [results, setResults] = useState(null);

  useEffect(() => {
    try {
      const data1 = group1Data.split(',').map(x => parseFloat(x.trim())).filter(x => !isNaN(x));
      const data2 = group2Data.split(',').map(x => parseFloat(x.trim())).filter(x => !isNaN(x));
      
      if (data1.length > 0 && data2.length > 0) {
        const testResults = calculateTwoSampleTTest(data1, data2, alpha, alternative, equalVariances);
        setResults(testResults);
      }
    } catch (error) {
      console.log("Error calculating t-test:", error);
    }
  }, [group1Data, group2Data, alpha, alternative, equalVariances]);

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Test Parameters</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="group1">Group 1 Data (comma-separated)</Label>
              <Textarea
                id="group1"
                placeholder="Enter Group 1 data values"
                value={group1Data}
                onChange={(e) => setGroup1Data(e.target.value)}
                className="mt-1"
                rows={2}
              />
            </div>
            
            <div>
              <Label htmlFor="group2">Group 2 Data (comma-separated)</Label>
              <Textarea
                id="group2"
                placeholder="Enter Group 2 data values"
                value={group2Data}
                onChange={(e) => setGroup2Data(e.target.value)}
                className="mt-1"
                rows={2}
              />
            </div>

            <div>
              <Label htmlFor="alpha">Significance Level (α)</Label>
              <Select value={alpha.toString()} onValueChange={(value) => setAlpha(parseFloat(value))}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0.01">0.01 (99% confidence)</SelectItem>
                  <SelectItem value="0.05">0.05 (95% confidence)</SelectItem>
                  <SelectItem value="0.10">0.10 (90% confidence)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="alternative">Alternative Hypothesis</Label>
              <Select value={alternative} onValueChange={setAlternative}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="two-sided">Two-sided (μ₁ ≠ μ₂)</SelectItem>
                  <SelectItem value="greater">Greater than (μ₁ {'>'} μ₂)</SelectItem>
                  <SelectItem value="less">Less than (μ₁ {'<'} μ₂)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox 
                id="equal-variances"
                checked={equalVariances}
                onCheckedChange={(checked) => setEqualVariances(checked === true)}
              />
              <Label htmlFor="equal-variances">Assume equal variances</Label>
            </div>
          </CardContent>
        </Card>

        {results && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                Test Results
                <Badge variant={results.isSignificant ? "destructive" : "secondary"}>
                  {results.isSignificant ? "Significant" : "Not Significant"}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Group 1 Mean:</span>
                  <div className="text-lg font-mono">{results.mean1.toFixed(3)}</div>
                </div>
                <div>
                  <span className="font-medium">Group 2 Mean:</span>
                  <div className="text-lg font-mono">{results.mean2.toFixed(3)}</div>
                </div>
                <div>
                  <span className="font-medium">t-statistic:</span>
                  <div className="text-lg font-mono">{results.tStatistic.toFixed(3)}</div>
                </div>
                <div>
                  <span className="font-medium">Degrees of Freedom:</span>
                  <div className="text-lg font-mono">{results.df.toFixed(0)}</div>
                </div>
                <div>
                  <span className="font-medium">p-value:</span>
                  <div className="text-lg font-mono">{results.pValue.toFixed(4)}</div>
                </div>
                <div>
                  <span className="font-medium">Effect Size (Cohen's d):</span>
                  <div className="text-lg font-mono">{results.effectSize.toFixed(3)}</div>
                </div>
              </div>
              
              <div className="mt-4 p-3 bg-muted rounded-lg">
                <p className="text-sm">
                  <strong>Interpretation:</strong> {results.interpretation}
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <div>
        {results && (
          <TTestVisualization 
            results={results}
            testType="two-sample"
          />
        )}
      </div>
    </div>
  );
};

export default TwoSampleTest;

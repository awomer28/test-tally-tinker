
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import TTestVisualization from "./TTestVisualization";
import { calculateOneSampleTTest } from "@/utils/tTestCalculations";

const OneSampleTest = () => {
  const [data, setData] = useState("23, 25, 21, 22, 27, 23, 25, 24, 26, 22");
  const [populationMean, setPopulationMean] = useState(24);
  const [alpha, setAlpha] = useState(0.05);
  const [alternative, setAlternative] = useState("two-sided");
  const [results, setResults] = useState(null);

  useEffect(() => {
    try {
      const dataArray = data.split(',').map(x => parseFloat(x.trim())).filter(x => !isNaN(x));
      if (dataArray.length > 0) {
        const testResults = calculateOneSampleTTest(dataArray, populationMean, alpha, alternative);
        setResults(testResults);
      }
    } catch (error) {
      console.log("Error calculating t-test:", error);
    }
  }, [data, populationMean, alpha, alternative]);

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Test Parameters</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="data">Sample Data (comma-separated)</Label>
              <Textarea
                id="data"
                placeholder="Enter your data values separated by commas"
                value={data}
                onChange={(e) => setData(e.target.value)}
                className="mt-1"
                rows={3}
              />
            </div>
            
            <div>
              <Label htmlFor="population-mean">Population Mean (μ₀)</Label>
              <Input
                id="population-mean"
                type="number"
                value={populationMean}
                onChange={(e) => setPopulationMean(parseFloat(e.target.value) || 0)}
                className="mt-1"
                step="0.01"
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
                  <SelectItem value="two-sided">Two-sided (μ ≠ μ₀)</SelectItem>
                  <SelectItem value="greater">Greater than (μ {'>'} μ₀)</SelectItem>
                  <SelectItem value="less">Less than (μ {'<'} μ₀)</SelectItem>
                </SelectContent>
              </Select>
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
                  <span className="font-medium">Sample Mean:</span>
                  <div className="text-lg font-mono">{results.sampleMean.toFixed(3)}</div>
                </div>
                <div>
                  <span className="font-medium">Sample Size:</span>
                  <div className="text-lg font-mono">{results.n}</div>
                </div>
                <div>
                  <span className="font-medium">t-statistic:</span>
                  <div className="text-lg font-mono">{results.tStatistic.toFixed(3)}</div>
                </div>
                <div>
                  <span className="font-medium">Degrees of Freedom:</span>
                  <div className="text-lg font-mono">{results.df}</div>
                </div>
                <div>
                  <span className="font-medium">p-value:</span>
                  <div className="text-lg font-mono">{results.pValue.toFixed(4)}</div>
                </div>
                <div>
                  <span className="font-medium">Critical Value:</span>
                  <div className="text-lg font-mono">±{results.criticalValue.toFixed(3)}</div>
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
            testType="one-sample"
          />
        )}
      </div>
    </div>
  );
};

export default OneSampleTest;


import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import TTestVisualization from "./TTestVisualization";
import { calculatePairedTTest } from "@/utils/tTestCalculations";

const PairedTest = () => {
  const [beforeData, setBeforeData] = useState("120, 118, 125, 122, 119, 121, 123");
  const [afterData, setAfterData] = useState("115, 112, 118, 116, 113, 115, 117");
  const [alpha, setAlpha] = useState(0.05);
  const [alternative, setAlternative] = useState("two-sided");
  const [results, setResults] = useState(null);

  useEffect(() => {
    try {
      const before = beforeData.split(',').map(x => parseFloat(x.trim())).filter(x => !isNaN(x));
      const after = afterData.split(',').map(x => parseFloat(x.trim())).filter(x => !isNaN(x));
      
      if (before.length > 0 && after.length > 0 && before.length === after.length) {
        const testResults = calculatePairedTTest(before, after, alpha, alternative);
        setResults(testResults);
      }
    } catch (error) {
      console.log("Error calculating paired t-test:", error);
    }
  }, [beforeData, afterData, alpha, alternative]);

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Test Parameters</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="before">Before/Pre Data (comma-separated)</Label>
              <Textarea
                id="before"
                placeholder="Enter before/pre treatment values"
                value={beforeData}
                onChange={(e) => setBeforeData(e.target.value)}
                className="mt-1"
                rows={2}
              />
            </div>
            
            <div>
              <Label htmlFor="after">After/Post Data (comma-separated)</Label>
              <Textarea
                id="after"
                placeholder="Enter after/post treatment values"
                value={afterData}
                onChange={(e) => setAfterData(e.target.value)}
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
                  <SelectItem value="two-sided">Two-sided (μd ≠ 0)</SelectItem>
                  <SelectItem value="greater">Greater than (μd > 0)</SelectItem>
                  <SelectItem value="less">Less than (μd < 0)</SelectItem>
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
                  <span className="font-medium">Mean Difference:</span>
                  <div className="text-lg font-mono">{results.meanDifference.toFixed(3)}</div>
                </div>
                <div>
                  <span className="font-medium">Pairs Count:</span>
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
            testType="paired"
          />
        )}
      </div>
    </div>
  );
};

export default PairedTest;


import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";
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
    <div className="space-y-6">
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          This analysis tests if your sample average is significantly different from a known target, standard, or benchmark value.
          For example: testing if average salary exceeds the national average, or if pollution levels exceed regulatory limits.
        </AlertDescription>
      </Alert>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Step 1: Enter Your Data</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="data" className="text-base font-medium">
                  Your Sample Data
                </Label>
                <p className="text-sm text-muted-foreground mb-2">
                  Enter your measured values separated by commas
                </p>
                <Textarea
                  id="data"
                  placeholder="Example: 23, 25, 21, 22, 27, 23, 25, 24, 26, 22"
                  value={data}
                  onChange={(e) => setData(e.target.value)}
                  className="mt-1"
                  rows={3}
                />
              </div>
              
              <div>
                <Label htmlFor="population-mean" className="text-base font-medium">
                  Target/Benchmark Value
                </Label>
                <p className="text-sm text-muted-foreground mb-2">
                  The known standard, regulation limit, or expected value you want to compare against
                </p>
                <Input
                  id="population-mean"
                  type="number"
                  value={populationMean}
                  onChange={(e) => setPopulationMean(parseFloat(e.target.value) || 0)}
                  className="mt-1"
                  step="0.01"
                  placeholder="Example: 24"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Step 2: Analysis Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="alpha" className="text-base font-medium">Confidence Level</Label>
                <Select value={alpha.toString()} onValueChange={(value) => setAlpha(parseFloat(value))}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0.01">99% confident (very strict)</SelectItem>
                    <SelectItem value="0.05">95% confident (standard)</SelectItem>
                    <SelectItem value="0.10">90% confident (more lenient)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="alternative" className="text-base font-medium">What are you testing?</Label>
                <Select value={alternative} onValueChange={setAlternative}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="two-sided">Is your average different from the target?</SelectItem>
                    <SelectItem value="greater">Is your average higher than the target?</SelectItem>
                    <SelectItem value="less">Is your average lower than the target?</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {results && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  Results
                  <Badge variant={results.isSignificant ? "destructive" : "secondary"}>
                    {results.isSignificant ? "Significantly Different" : "Not Significantly Different"}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <span className="font-medium text-blue-900">Your Sample Average:</span>
                    <div className="text-xl font-mono text-blue-800">{results.sampleMean.toFixed(2)}</div>
                  </div>
                  <div className="p-3 bg-green-50 rounded-lg">
                    <span className="font-medium text-green-900">Target Value:</span>
                    <div className="text-xl font-mono text-green-800">{populationMean}</div>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <span className="font-medium">Difference:</span>
                    <div className="text-xl font-mono">
                      {results.sampleMean > populationMean ? '+' : ''}{(results.sampleMean - populationMean).toFixed(2)}
                    </div>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <span className="font-medium">Sample Size:</span>
                    <div className="text-xl font-mono">{results.n}</div>
                  </div>
                </div>
                
                <div className="p-4 bg-muted rounded-lg">
                  <h4 className="font-semibold mb-2">What does this mean?</h4>
                  <p className="text-sm leading-relaxed">
                    {results.interpretation}
                  </p>
                </div>

                <div className="text-xs text-muted-foreground">
                  p-value: {results.pValue.toFixed(4)}
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
    </div>
  );
};

export default OneSampleTest;

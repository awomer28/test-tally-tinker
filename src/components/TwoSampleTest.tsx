
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";
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
    <div className="space-y-6">
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          This analysis compares the average values between two groups to determine if they're statistically different.
          For example: comparing average income between two regions, or test scores between two teaching methods.
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
                <Label htmlFor="group1" className="text-base font-medium">
                  Group 1 Data (e.g., Control Group, Region A, Before Treatment)
                </Label>
                <p className="text-sm text-muted-foreground mb-2">
                  Enter numbers separated by commas
                </p>
                <Textarea
                  id="group1"
                  placeholder="Example: 23, 25, 21, 22, 27, 23, 25"
                  value={group1Data}
                  onChange={(e) => setGroup1Data(e.target.value)}
                  className="mt-1"
                  rows={2}
                />
              </div>
              
              <div>
                <Label htmlFor="group2" className="text-base font-medium">
                  Group 2 Data (e.g., Treatment Group, Region B, After Treatment)
                </Label>
                <p className="text-sm text-muted-foreground mb-2">
                  Enter numbers separated by commas
                </p>
                <Textarea
                  id="group2"
                  placeholder="Example: 26, 28, 24, 25, 30, 27, 29"
                  value={group2Data}
                  onChange={(e) => setGroup2Data(e.target.value)}
                  className="mt-1"
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Step 2: Choose Analysis Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="alpha" className="text-base font-medium">Confidence Level</Label>
                <p className="text-sm text-muted-foreground mb-2">
                  How confident do you want to be in your results?
                </p>
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
                <p className="text-sm text-muted-foreground mb-2">
                  Choose based on your research question
                </p>
                <Select value={alternative} onValueChange={setAlternative}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="two-sided">Are the groups different? (most common)</SelectItem>
                    <SelectItem value="greater">Is Group 1 higher than Group 2?</SelectItem>
                    <SelectItem value="less">Is Group 1 lower than Group 2?</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-start space-x-2 pt-2">
                <Checkbox 
                  id="equal-variances"
                  checked={equalVariances}
                  onCheckedChange={(checked) => setEqualVariances(checked === true)}
                />
                <div>
                  <Label htmlFor="equal-variances" className="text-base font-medium">
                    Assume similar variability in both groups
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Check this if you expect both groups to have similar spread in their data (recommended for most cases)
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {results && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  Results
                  <Badge variant={results.isSignificant ? "destructive" : "secondary"}>
                    {results.isSignificant ? "Statistically Significant" : "Not Significant"}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <span className="font-medium text-blue-900">Group 1 Average:</span>
                    <div className="text-xl font-mono text-blue-800">{results.mean1.toFixed(2)}</div>
                  </div>
                  <div className="p-3 bg-green-50 rounded-lg">
                    <span className="font-medium text-green-900">Group 2 Average:</span>
                    <div className="text-xl font-mono text-green-800">{results.mean2.toFixed(2)}</div>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <span className="font-medium">Difference:</span>
                    <div className="text-xl font-mono">{(results.mean1 - results.mean2).toFixed(2)}</div>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <span className="font-medium">Effect Size:</span>
                    <div className="text-xl font-mono">{results.effectSize.toFixed(2)}</div>
                    <div className="text-xs text-muted-foreground">
                      {Math.abs(results.effectSize) < 0.2 ? "Small" : 
                       Math.abs(results.effectSize) < 0.5 ? "Medium" : "Large"} effect
                    </div>
                  </div>
                </div>
                
                <div className="p-4 bg-muted rounded-lg">
                  <h4 className="font-semibold mb-2">What does this mean?</h4>
                  <p className="text-sm leading-relaxed">
                    {results.interpretation}
                  </p>
                </div>

                <div className="text-xs text-muted-foreground grid grid-cols-2 gap-4">
                  <div>p-value: {results.pValue.toFixed(4)}</div>
                  <div>Sample sizes: {results.n1}, {results.n2}</div>
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
    </div>
  );
};

export default TwoSampleTest;

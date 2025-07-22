
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { Info } from "lucide-react";
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

  const getEffectSizeLabel = (effectSize) => {
    const absEffect = Math.abs(effectSize);
    if (absEffect < 0.2) return "Small";
    if (absEffect < 0.5) return "Medium";
    if (absEffect < 0.8) return "Large";
    return "Very Large";
  };

  return (
    <div className="space-y-6">
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          This analysis tests if there's a significant change between before and after measurements from the same subjects.
          For example: testing policy effectiveness, treatment outcomes, or training program impact.
        </AlertDescription>
      </Alert>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Step 1: Enter Your Paired Data</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="before" className="text-base font-medium">
                  Before/Baseline Measurements
                </Label>
                <p className="text-sm text-muted-foreground mb-2">
                  Enter the initial values for each subject/unit
                </p>
                <Textarea
                  id="before"
                  placeholder="Example: 120, 118, 125, 122, 119, 121, 123"
                  value={beforeData}
                  onChange={(e) => setBeforeData(e.target.value)}
                  className="mt-1"
                  rows={2}
                />
              </div>
              
              <div>
                <Label htmlFor="after" className="text-base font-medium">
                  After/Follow-up Measurements
                </Label>
                <p className="text-sm text-muted-foreground mb-2">
                  Enter the follow-up values for the same subjects (same order)
                </p>
                <Textarea
                  id="after"
                  placeholder="Example: 115, 112, 118, 116, 113, 115, 117"
                  value={afterData}
                  onChange={(e) => setAfterData(e.target.value)}
                  className="mt-1"
                  rows={2}
                />
              </div>
              
              <div className="text-sm text-amber-600 bg-amber-50 p-3 rounded">
                <strong>Important:</strong> Make sure both lists have the same number of values and are in the same order 
                (1st before value matches 1st after value for the same subject).
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
                    <SelectItem value="two-sided">Is there any change? (most common)</SelectItem>
                    <SelectItem value="greater">Did values increase?</SelectItem>
                    <SelectItem value="less">Did values decrease?</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {results && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  Statistical Results
                  <Badge variant={results.isSignificant ? "destructive" : "secondary"}>
                    {results.isSignificant ? "Statistically Significant" : "Not Significant"}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableBody>
                    <TableRow>
                      <TableCell className="font-medium">Test Used</TableCell>
                      <TableCell>Paired samples t-test</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Sample Size</TableCell>
                      <TableCell>n = {results.n} pairs</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Mean Before</TableCell>
                      <TableCell>{results.meanBefore?.toFixed(2) || 'N/A'}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Mean After</TableCell>
                      <TableCell>{results.meanAfter?.toFixed(2) || 'N/A'}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Mean Change</TableCell>
                      <TableCell>
                        <span className={results.meanDifference > 0 ? "text-green-600" : results.meanDifference < 0 ? "text-red-600" : ""}>
                          {results.meanDifference > 0 ? '+' : ''}{results.meanDifference.toFixed(2)}
                        </span>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">t-statistic</TableCell>
                      <TableCell>{results.tStatistic?.toFixed(3) || 'N/A'}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">p-value</TableCell>
                      <TableCell>{results.pValue?.toFixed(4) || 'N/A'}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Effect Size (Cohen's d)</TableCell>
                      <TableCell>
                        {results.effectSize?.toFixed(2) || 'N/A'} 
                        {results.effectSize && (
                          <span className="text-sm text-muted-foreground ml-1">
                            ({getEffectSizeLabel(results.effectSize)} effect)
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">95% Confidence Interval</TableCell>
                      <TableCell>
                        [{results.confidenceInterval?.[0]?.toFixed(3) || 'N/A'}, {results.confidenceInterval?.[1]?.toFixed(3) || 'N/A'}]
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </div>

        <div>
          {results && (
            <TTestVisualization 
              results={results}
              testType="paired"
              beforeData={beforeData.split(',').map(x => parseFloat(x.trim())).filter(x => !isNaN(x))}
              afterData={afterData.split(',').map(x => parseFloat(x.trim())).filter(x => !isNaN(x))}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default PairedTest;

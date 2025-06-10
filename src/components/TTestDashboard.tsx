
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, Users, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";
import TTestVisualization from "./TTestVisualization";
import { calculateOneSampleTTest, calculateTwoSampleTTest, calculatePairedTTest } from "@/utils/tTestCalculations";

const TTestDashboard = () => {
  const [analysisType, setAnalysisType] = useState("two-sample");
  const [variable1, setVariable1] = useState("");
  const [variable2, setVariable2] = useState("");
  const [targetValue, setTargetValue] = useState("");
  const [alpha, setAlpha] = useState("0.05");
  const [alternative, setAlternative] = useState("two-sided");
  const [results, setResults] = useState(null);

  // Mock dataset variables - in real app this would come from uploaded data
  const availableVariables = [
    "Income", "Age", "Education_Years", "Salary", "Test_Score_Before", 
    "Test_Score_After", "GDP_Per_Capita", "Population", "Temperature", 
    "Rainfall", "Sales_Q1", "Sales_Q2", "Blood_Pressure_Before", "Blood_Pressure_After"
  ];

  const handleRunAnalysis = () => {
    // Mock data generation - in real app this would use actual dataset values
    const generateMockData = (variable) => {
      const baseValue = variable.includes("Before") ? 120 : 
                       variable.includes("After") ? 115 :
                       variable.includes("Income") ? 50000 :
                       variable.includes("Age") ? 35 : 75;
      
      return Array.from({length: 20}, () => 
        Math.round(baseValue + (Math.random() - 0.5) * baseValue * 0.3)
      );
    };

    try {
      let testResults;
      
      if (analysisType === "one-sample" && variable1 && targetValue) {
        const data = generateMockData(variable1);
        testResults = calculateOneSampleTTest(data, parseFloat(targetValue), parseFloat(alpha), alternative);
      } else if (analysisType === "two-sample" && variable1 && variable2) {
        const data1 = generateMockData(variable1);
        const data2 = generateMockData(variable2);
        testResults = calculateTwoSampleTTest(data1, data2, parseFloat(alpha), alternative, true);
      } else if (analysisType === "paired" && variable1 && variable2) {
        const data1 = generateMockData(variable1);
        const data2 = generateMockData(variable2);
        testResults = calculatePairedTTest(data1, data2, parseFloat(alpha), alternative);
      }
      
      setResults(testResults);
    } catch (error) {
      console.log("Error calculating analysis:", error);
    }
  };

  const isReadyToAnalyze = () => {
    if (analysisType === "one-sample") return variable1 && targetValue;
    if (analysisType === "two-sample") return variable1 && variable2;
    if (analysisType === "paired") return variable1 && variable2;
    return false;
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Statistical Analysis Setup
              </CardTitle>
              <CardDescription>
                Select variables from your dataset and choose the type of analysis
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              
              {/* Analysis Type Selection */}
              <div>
                <Label className="text-base font-medium">Type of Analysis</Label>
                <Select value={analysisType} onValueChange={setAnalysisType}>
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="two-sample">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        Compare Two Groups
                      </div>
                    </SelectItem>
                    <SelectItem value="paired">
                      <div className="flex items-center gap-2">
                        <Activity className="w-4 h-4" />
                        Before & After Analysis
                      </div>
                    </SelectItem>
                    <SelectItem value="one-sample">
                      <div className="flex items-center gap-2">
                        <Upload className="w-4 h-4" />
                        Compare to Target Value
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Variable Selection */}
              <div className="space-y-4">
                <div>
                  <Label className="text-base font-medium">
                    {analysisType === "one-sample" ? "Select Variable" :
                     analysisType === "paired" ? "Before/Baseline Variable" :
                     "First Group/Variable"}
                  </Label>
                  <Select value={variable1} onValueChange={setVariable1}>
                    <SelectTrigger className="mt-2">
                      <SelectValue placeholder="Choose a variable from your dataset" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableVariables.map((variable) => (
                        <SelectItem key={variable} value={variable}>
                          {variable.replace(/_/g, ' ')}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {analysisType !== "one-sample" && (
                  <div>
                    <Label className="text-base font-medium">
                      {analysisType === "paired" ? "After/Follow-up Variable" : "Second Group/Variable"}
                    </Label>
                    <Select value={variable2} onValueChange={setVariable2}>
                      <SelectTrigger className="mt-2">
                        <SelectValue placeholder="Choose a second variable" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableVariables.filter(v => v !== variable1).map((variable) => (
                          <SelectItem key={variable} value={variable}>
                            {variable.replace(/_/g, ' ')}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {analysisType === "one-sample" && (
                  <div>
                    <Label className="text-base font-medium">Target/Benchmark Value</Label>
                    <input
                      type="number"
                      value={targetValue}
                      onChange={(e) => setTargetValue(e.target.value)}
                      className="mt-2 w-full px-3 py-2 border border-input rounded-md"
                      placeholder="Enter comparison value"
                      step="0.01"
                    />
                  </div>
                )}
              </div>

              {/* Analysis Settings */}
              <div className="space-y-4">
                <div>
                  <Label className="text-base font-medium">Confidence Level</Label>
                  <Select value={alpha} onValueChange={setAlpha}>
                    <SelectTrigger className="mt-2">
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
                  <Label className="text-base font-medium">Research Question</Label>
                  <Select value={alternative} onValueChange={setAlternative}>
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="two-sided">
                        {analysisType === "one-sample" ? "Is there any difference from target?" :
                         analysisType === "paired" ? "Is there any change?" :
                         "Are the groups different?"}
                      </SelectItem>
                      <SelectItem value="greater">
                        {analysisType === "one-sample" ? "Is the variable higher than target?" :
                         analysisType === "paired" ? "Did values increase?" :
                         "Is first group higher?"}
                      </SelectItem>
                      <SelectItem value="less">
                        {analysisType === "one-sample" ? "Is the variable lower than target?" :
                         analysisType === "paired" ? "Did values decrease?" :
                         "Is first group lower?"}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button 
                onClick={handleRunAnalysis}
                disabled={!isReadyToAnalyze()}
                className="w-full"
                size="lg"
              >
                Run Analysis
              </Button>

              {/* Info Alert */}
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  {analysisType === "one-sample" && "Compare your variable's average to a specific target or benchmark value."}
                  {analysisType === "paired" && "Analyze changes in the same subjects measured at two different times."}
                  {analysisType === "two-sample" && "Compare averages between two different groups or conditions."}
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          {/* Results */}
          {results && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  Analysis Results
                  <Badge variant={results.isSignificant ? "destructive" : "secondary"}>
                    {results.isSignificant ? "Statistically Significant" : "Not Significant"}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  {analysisType === "one-sample" && (
                    <>
                      <div className="p-3 bg-blue-50 rounded-lg">
                        <span className="font-medium text-blue-900">Sample Average:</span>
                        <div className="text-xl font-mono text-blue-800">{results.sampleMean?.toFixed(2) || results.mean1?.toFixed(2)}</div>
                      </div>
                      <div className="p-3 bg-green-50 rounded-lg">
                        <span className="font-medium text-green-900">Target Value:</span>
                        <div className="text-xl font-mono text-green-800">{targetValue}</div>
                      </div>
                    </>
                  )}
                  
                  {analysisType === "two-sample" && (
                    <>
                      <div className="p-3 bg-blue-50 rounded-lg">
                        <span className="font-medium text-blue-900">{variable1?.replace(/_/g, ' ')} Average:</span>
                        <div className="text-xl font-mono text-blue-800">{results.mean1?.toFixed(2)}</div>
                      </div>
                      <div className="p-3 bg-green-50 rounded-lg">
                        <span className="font-medium text-green-900">{variable2?.replace(/_/g, ' ')} Average:</span>
                        <div className="text-xl font-mono text-green-800">{results.mean2?.toFixed(2)}</div>
                      </div>
                    </>
                  )}

                  {analysisType === "paired" && (
                    <>
                      <div className="p-3 bg-blue-50 rounded-lg">
                        <span className="font-medium text-blue-900">Average Change:</span>
                        <div className="text-xl font-mono text-blue-800">
                          {results.meanDifference > 0 ? '+' : ''}{results.meanDifference?.toFixed(2)}
                        </div>
                      </div>
                      <div className="p-3 bg-green-50 rounded-lg">
                        <span className="font-medium text-green-900">Effect Size:</span>
                        <div className="text-xl font-mono text-green-800">{results.effectSize?.toFixed(2)}</div>
                      </div>
                    </>
                  )}
                </div>
                
                <div className="p-4 bg-muted rounded-lg">
                  <h4 className="font-semibold mb-2">Interpretation</h4>
                  <p className="text-sm leading-relaxed">
                    {results.interpretation}
                  </p>
                </div>

                <div className="text-xs text-muted-foreground">
                  p-value: {results.pValue?.toFixed(4)}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div>
          {results && (
            <TTestVisualization 
              results={results}
              testType={analysisType}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default TTestDashboard;

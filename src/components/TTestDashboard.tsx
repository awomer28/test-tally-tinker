
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
import { calculateOneSampleTTest, calculateTwoSampleTTest, calculatePairedTTest, calculateANOVA } from "@/utils/tTestCalculations";

const TTestDashboard = () => {
  const [analysisType, setAnalysisType] = useState("two-sample");
  const [selectedVariables, setSelectedVariables] = useState(["", ""]);
  const [targetValue, setTargetValue] = useState("");
  const [alpha, setAlpha] = useState("0.05");
  const [alternative, setAlternative] = useState("two-sided");
  const [statistic, setStatistic] = useState("mean");
  const [results, setResults] = useState(null);

  // Mock dataset variables - in real app this would come from uploaded data
  const availableVariables = [
    "Income", "Age", "Education_Years", "Salary", "Test_Score_Before", 
    "Test_Score_After", "GDP_Per_Capita", "Population", "Temperature", 
    "Rainfall", "Sales_Q1", "Sales_Q2", "Blood_Pressure_Before", "Blood_Pressure_After"
  ];

  const addVariable = () => {
    setSelectedVariables([...selectedVariables, ""]);
  };

  const removeVariable = (index: number) => {
    if (selectedVariables.length > 2) {
      setSelectedVariables(selectedVariables.filter((_, i) => i !== index));
    }
  };

  const updateVariable = (index: number, value: string) => {
    const newVariables = [...selectedVariables];
    newVariables[index] = value;
    setSelectedVariables(newVariables);
  };

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
      
      if (analysisType === "one-sample" && selectedVariables[0] && targetValue) {
        const data = generateMockData(selectedVariables[0]);
        testResults = calculateOneSampleTTest(data, parseFloat(targetValue), parseFloat(alpha), alternative, statistic);
      } else if (analysisType === "paired" && selectedVariables[0] && selectedVariables[1]) {
        const data1 = generateMockData(selectedVariables[0]);
        const data2 = generateMockData(selectedVariables[1]);
        testResults = calculatePairedTTest(data1, data2, parseFloat(alpha), alternative, statistic);
      } else if (analysisType === "two-sample" && selectedVariables.filter(v => v).length >= 2) {
        const groups = selectedVariables.filter(v => v).map(variable => generateMockData(variable));
        const groupNames = selectedVariables.filter(v => v);
        
        if (groups.length === 2) {
          testResults = calculateTwoSampleTTest(groups[0], groups[1], parseFloat(alpha), alternative, true, statistic, groupNames);
        } else {
          // ANOVA for multiple groups
          testResults = calculateANOVA(groups, parseFloat(alpha), statistic, groupNames);
          testResults.testType = "anova";
        }
      }
      
      // Add group names for interpretation
      if (testResults) {
        testResults.groupNames = selectedVariables.filter(v => v);
      }
      
      setResults(testResults);
    } catch (error) {
      console.log("Error calculating analysis:", error);
    }
  };

  const isReadyToAnalyze = () => {
    if (analysisType === "one-sample") return selectedVariables[0] && targetValue;
    if (analysisType === "paired") return selectedVariables[0] && selectedVariables[1];
    if (analysisType === "two-sample") return selectedVariables.filter(v => v).length >= 2;
    return false;
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <Card>
            <CardContent className="space-y-6 pt-6">
              
              {/* Analysis Type Selection */}
              <div>
                <Label className="text-base font-medium">Type of comparison</Label>
                <Select value={analysisType} onValueChange={setAnalysisType}>
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="two-sample">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        Compare two or more groups
                      </div>
                    </SelectItem>
                    <SelectItem value="one-sample">
                      <div className="flex items-center gap-2">
                        <Upload className="w-4 h-4" />
                        Compare to target value
                      </div>
                    </SelectItem>
                    <SelectItem value="paired">
                      <div className="flex items-center gap-2">
                        <Activity className="w-4 h-4" />
                        Before & after analysis
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Variable Selection */}
              <div className="space-y-4">
                {analysisType === "one-sample" ? (
                  <div>
                    <Label className="text-base font-medium">Select variable</Label>
                    <Select value={selectedVariables[0]} onValueChange={(value) => updateVariable(0, value)}>
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
                ) : (
                  <div className="space-y-3">
                    {selectedVariables.map((variable, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <div className="flex-1">
                          <Label className="text-base font-medium">
                            {analysisType === "paired" ? 
                              (index === 0 ? "Before/baseline variable" : "After/follow-up variable") :
                              `${index === 0 ? "First" : index === 1 ? "Second" : `Group ${index + 1}`} group variable`
                            }
                          </Label>
                          <Select value={variable} onValueChange={(value) => updateVariable(index, value)}>
                            <SelectTrigger className="mt-2">
                              <SelectValue placeholder="Choose a variable" />
                            </SelectTrigger>
                            <SelectContent>
                              {availableVariables.filter(v => !selectedVariables.includes(v) || v === variable).map((availableVar) => (
                                <SelectItem key={availableVar} value={availableVar}>
                                  {availableVar.replace(/_/g, ' ')}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        {analysisType === "two-sample" && selectedVariables.length > 2 && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => removeVariable(index)}
                            className="mt-6"
                          >
                            Remove
                          </Button>
                        )}
                      </div>
                    ))}
                    
                    {analysisType === "two-sample" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={addVariable}
                        className="w-full"
                      >
                        + Add group
                      </Button>
                    )}
                  </div>
                )}

                {analysisType === "one-sample" && (
                  <div>
                    <Label className="text-base font-medium">Target value</Label>
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
                  <Label className="text-base font-medium">Confidence level</Label>
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

                {analysisType !== "two-sample" || selectedVariables.filter(v => v).length === 2 ? (
                  <div>
                    <Label className="text-base font-medium">Research question</Label>
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
                ) : null}
                
                <div>
                  <Label className="text-base font-medium">Statistic to compare</Label>
                  <Select value={statistic} onValueChange={setStatistic}>
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mean">Average (mean)</SelectItem>
                      <SelectItem value="median">Median</SelectItem>
                      <SelectItem value="proportion">Proportion (for categorical data)</SelectItem>
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
                Run analysis
              </Button>

              {/* Info Alert */}
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  {analysisType === "one-sample" && "Compare your variable's average to a specific target or benchmark value."}
                  {analysisType === "paired" && "Analyze changes in the same subjects measured at two different times."}
                  {analysisType === "two-sample" && selectedVariables.filter(v => v).length > 2 ? "Compare averages across multiple groups using ANOVA." : "Compare averages between two different groups or conditions."}
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          {/* Results */}
          {results && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  Analysis results
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
                        <span className="font-medium text-blue-900">Sample average:</span>
                        <div className="text-xl font-mono text-blue-800">{results.sampleMean?.toFixed(2) || results.mean1?.toFixed(2)}</div>
                      </div>
                      <div className="p-3 bg-green-50 rounded-lg">
                        <span className="font-medium text-green-900">Target value:</span>
                        <div className="text-xl font-mono text-green-800">{targetValue}</div>
                      </div>
                    </>
                  )}
                  
                  {analysisType === "two-sample" && results.testType === "anova" && (
                    <>
                      {results.groupMeans?.map((mean, index) => (
                        <div key={index} className="p-3 bg-blue-50 rounded-lg">
                          <span className="font-medium text-blue-900">{selectedVariables[index]?.replace(/_/g, ' ')} average:</span>
                          <div className="text-xl font-mono text-blue-800">{mean.toFixed(2)}</div>
                        </div>
                      ))}
                      <div className="p-3 bg-green-50 rounded-lg">
                        <span className="font-medium text-green-900">Effect size (η²):</span>
                        <div className="text-xl font-mono text-green-800">{results.etaSquared?.toFixed(3)}</div>
                      </div>
                    </>
                  )}

                  {analysisType === "two-sample" && results.testType !== "anova" && (
                    <>
                      <div className="p-3 bg-blue-50 rounded-lg">
                        <span className="font-medium text-blue-900">{selectedVariables[0]?.replace(/_/g, ' ')} average:</span>
                        <div className="text-xl font-mono text-blue-800">{results.mean1?.toFixed(2)}</div>
                      </div>
                      <div className="p-3 bg-green-50 rounded-lg">
                        <span className="font-medium text-green-900">{selectedVariables[1]?.replace(/_/g, ' ')} average:</span>
                        <div className="text-xl font-mono text-green-800">{results.mean2?.toFixed(2)}</div>
                      </div>
                    </>
                  )}

                  {analysisType === "paired" && (
                    <>
                      <div className="p-3 bg-blue-50 rounded-lg">
                        <span className="font-medium text-blue-900">Average change:</span>
                        <div className="text-xl font-mono text-blue-800">
                          {results.meanDifference > 0 ? '+' : ''}{results.meanDifference?.toFixed(2)}
                        </div>
                      </div>
                      <div className="p-3 bg-green-50 rounded-lg">
                        <span className="font-medium text-green-900">Effect size:</span>
                        <div className="text-xl font-mono text-green-800">{results.effectSize?.toFixed(2)}</div>
                      </div>
                    </>
                  )}
                </div>
                
                <div className="p-4 bg-muted rounded-lg">
                  <div className="text-sm leading-relaxed whitespace-pre-line">
                    {results.interpretation}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div>
          {results && (
            <TTestVisualization 
              results={results}
              testType={results.testType === "anova" ? "anova" : analysisType}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default TTestDashboard;

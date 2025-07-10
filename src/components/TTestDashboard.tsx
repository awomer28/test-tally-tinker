
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, Users, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Info } from "lucide-react";
import TTestVisualization from "./TTestVisualization";
import { calculateOneSampleTTest, calculateTwoSampleTTest, calculatePairedTTest, calculateANOVA } from "@/utils/tTestCalculations";

const TTestDashboard = () => {
  const [comparisonType, setComparisonType] = useState("compare-groups");
  const [statisticType, setStatisticType] = useState("mean");
  const [selectedVariables, setSelectedVariables] = useState(["", ""]);
  const [groupingVariable, setGroupingVariable] = useState("");
  const [outcomeVariable, setOutcomeVariable] = useState("");
  const [successCategory, setSuccessCategory] = useState("");
  const [targetValue, setTargetValue] = useState("");
  const [alpha, setAlpha] = useState("0.05");
  const [alternative, setAlternative] = useState("two-sided");
  const [results, setResults] = useState(null);

  // Mock dataset variables - in real app this would come from uploaded data
  const numericalVariables = [
    "Income", "Age", "Education_Years", "Salary", "Test_Score_Before", 
    "Test_Score_After", "GDP_Per_Capita", "Population", "Temperature", 
    "Rainfall", "Sales_Q1", "Sales_Q2", "Blood_Pressure_Before", "Blood_Pressure_After"
  ];

  const categoricalVariables = [
    "Gender", "School_District", "Treatment_Group", "Department", "Region", 
    "Education_Level", "Job_Category", "Product_Type", "Customer_Segment", "Grade_Level"
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

    // Generate mock group data for categorical variables
    const generateGroupData = (categoricalVar, numericalVar) => {
      // Mock groups based on categorical variable
      const groupValues = categoricalVar === "Gender" ? ["Male", "Female"] :
                         categoricalVar === "School_District" ? ["North", "South", "East"] :
                         categoricalVar === "Treatment_Group" ? ["Control", "Treatment"] :
                         ["Group_A", "Group_B"];
      
      return groupValues.map(groupName => ({
        groupName,
        data: generateMockData(numericalVar)
      }));
    };

    try {
      let testResults;
      const statistic = comparisonType === "compare-groups" ? statisticType : "mean";
      
      if (comparisonType === "compare-to-target" && selectedVariables[0] && targetValue) {
        const data = generateMockData(selectedVariables[0]);
        testResults = calculateOneSampleTTest(data, parseFloat(targetValue), parseFloat(alpha), alternative, statistic);
      } else if (comparisonType === "compare-before-after" && selectedVariables[0] && selectedVariables[1]) {
        const data1 = generateMockData(selectedVariables[0]);
        const data2 = generateMockData(selectedVariables[1]);
        testResults = calculatePairedTTest(data1, data2, parseFloat(alpha), alternative, statistic);
      } else if (comparisonType === "compare-groups" && groupingVariable && outcomeVariable) {
        const groupData = generateGroupData(groupingVariable, outcomeVariable);
        const groups = groupData.map(g => g.data);
        const groupNames = groupData.map(g => g.groupName);
        
        if (groups.length === 2) {
          testResults = calculateTwoSampleTTest(groups[0], groups[1], parseFloat(alpha), alternative, true, statistic, groupNames);
        } else {
          // ANOVA for multiple groups
          testResults = calculateANOVA(groups, parseFloat(alpha), statistic, groupNames);
          testResults.testType = "anova";
        }
      }
      
      // Add metadata for interpretation
      if (testResults) {
        testResults.groupNames = comparisonType === "compare-groups" ? 
          (groupingVariable === "Gender" ? ["Male", "Female"] :
           groupingVariable === "School_District" ? ["North", "South", "East"] :
           groupingVariable === "Treatment_Group" ? ["Control", "Treatment"] :
           ["Group_A", "Group_B"]) : selectedVariables.filter(v => v);
        testResults.comparisonType = comparisonType;
        testResults.statisticType = statisticType;
        testResults.groupingVariable = groupingVariable;
        testResults.outcomeVariable = outcomeVariable;
      }
      
      setResults(testResults);
    } catch (error) {
      console.log("Error calculating analysis:", error);
    }
  };

  const isReadyToAnalyze = () => {
    if (comparisonType === "compare-to-target") return selectedVariables[0] && targetValue;
    if (comparisonType === "compare-before-after") return selectedVariables[0] && selectedVariables[1];
    if (comparisonType === "compare-groups") {
      if (statisticType === "proportion") {
        return groupingVariable && outcomeVariable && successCategory;
      }
      return groupingVariable && outcomeVariable;
    }
    return false;
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {!results ? (
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">Statistical Analysis</h1>
            <p className="text-muted-foreground">Compare groups, analyze changes, and test hypotheses with your data</p>
          </div>
          
          <Card>
            <CardContent className="space-y-6 pt-6">
              
              {/* Comparison Type Selection */}
              <div>
                <Label className="text-base font-medium">Type of comparison</Label>
                <Select value={comparisonType} onValueChange={setComparisonType}>
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                   <SelectContent>
                     <SelectItem value="compare-groups">
                       <div className="flex items-center gap-2">
                         <Users className="w-4 h-4" />
                         Compare between groups
                       </div>
                     </SelectItem>
                     <SelectItem value="compare-different-variables">
                       <div className="flex items-center gap-2">
                         <Upload className="w-4 h-4" />
                         Compare different variables
                       </div>
                     </SelectItem>
                     <SelectItem value="compare-before-after">
                       <div className="flex items-center gap-2">
                         <Activity className="w-4 h-4" />
                         Compare before and after
                       </div>
                     </SelectItem>
                   </SelectContent>
                </Select>
               </div>

               {/* Statistic Type Selection - only show for group comparisons */}
               {comparisonType === "compare-groups" && (
                 <div>
                   <Label className="text-base font-medium">What to compare</Label>
                   <Select value={statisticType} onValueChange={setStatisticType}>
                     <SelectTrigger className="mt-2">
                       <SelectValue />
                     </SelectTrigger>
                     <SelectContent>
                       <SelectItem value="mean">Averages/means</SelectItem>
                       <SelectItem value="median">Medians</SelectItem>
                       <SelectItem value="variance">Variances</SelectItem>
                       <SelectItem value="proportion">Rates/percentages</SelectItem>
                     </SelectContent>
                   </Select>
                 </div>
               )}

              {/* Variable Selection */}
              <div className="space-y-4">
                 {comparisonType === "compare-to-target" ? (
                   <div>
                     <Label className="text-base font-medium">Select variable</Label>
                     <Select value={selectedVariables[0]} onValueChange={(value) => updateVariable(0, value)}>
                       <SelectTrigger className="mt-2">
                         <SelectValue placeholder="Choose a variable from your dataset" />
                       </SelectTrigger>
                       <SelectContent>
                         {numericalVariables.map((variable) => (
                           <SelectItem key={variable} value={variable}>
                             {variable.replace(/_/g, ' ')}
                           </SelectItem>
                         ))}
                       </SelectContent>
                     </Select>
                   </div>
                  ) : comparisonType === "compare-groups" ? (
                    <div className="space-y-4">
                       {statisticType === "proportion" ? (
                         <>
                           <div>
                             <Label className="text-base font-medium">Grouping variable (categorical)</Label>
                             <Select value={groupingVariable} onValueChange={setGroupingVariable}>
                               <SelectTrigger className="mt-2">
                                 <SelectValue placeholder="Choose how to divide into groups" />
                               </SelectTrigger>
                               <SelectContent>
                                 {categoricalVariables.filter(v => v !== outcomeVariable).map((variable) => (
                                   <SelectItem key={variable} value={variable}>
                                     {variable.replace(/_/g, ' ')}
                                   </SelectItem>
                                 ))}
                               </SelectContent>
                             </Select>
                           </div>
                           
                           <div>
                             <Label className="text-base font-medium">Outcome variable (categorical)</Label>
                             <Select value={outcomeVariable} onValueChange={(value) => {
                               setOutcomeVariable(value);
                               setSuccessCategory(""); // Reset success category when outcome changes
                             }}>
                               <SelectTrigger className="mt-2">
                                 <SelectValue placeholder="Choose what you're measuring (Pass/Fail, Yes/No, etc.)" />
                               </SelectTrigger>
                               <SelectContent>
                                 {categoricalVariables.filter(v => v !== groupingVariable).map((variable) => (
                                   <SelectItem key={variable} value={variable}>
                                     {variable.replace(/_/g, ' ')}
                                   </SelectItem>
                                 ))}
                               </SelectContent>
                             </Select>
                           </div>
                           
                            <div>
                              <Label className="text-base font-medium">Success category</Label>
                              <Select value={successCategory} onValueChange={setSuccessCategory} disabled={!outcomeVariable}>
                                <SelectTrigger className="mt-2">
                                  <SelectValue placeholder={!outcomeVariable ? "Select outcome variable first" : "Which outcome counts as success?"} />
                                </SelectTrigger>
                                <SelectContent>
                                  {/* Mock categories based on outcome variable */}
                                  {outcomeVariable === "Treatment_Group" && (
                                    <>
                                      <SelectItem value="Treatment">Treatment</SelectItem>
                                      <SelectItem value="Control">Control</SelectItem>
                                    </>
                                  )}
                                  {outcomeVariable === "Gender" && (
                                    <>
                                      <SelectItem value="Male">Male</SelectItem>
                                      <SelectItem value="Female">Female</SelectItem>
                                    </>
                                  )}
                                  {outcomeVariable === "Grade_Level" && (
                                    <>
                                      <SelectItem value="Pass">Pass</SelectItem>
                                      <SelectItem value="Fail">Fail</SelectItem>
                                      <SelectItem value="Honors">Honors</SelectItem>
                                    </>
                                  )}
                                  {!["Treatment_Group", "Gender", "Grade_Level"].includes(outcomeVariable) && (
                                    <>
                                      <SelectItem value="Yes">Yes</SelectItem>
                                      <SelectItem value="No">No</SelectItem>
                                      <SelectItem value="Success">Success</SelectItem>
                                      <SelectItem value="Fail">Fail</SelectItem>
                                    </>
                                  )}
                                </SelectContent>
                              </Select>
                            </div>
                          </>
                        ) : (
                        <>
                          <div>
                            <Label className="text-base font-medium">Grouping variable (categorical)</Label>
                            <Select value={groupingVariable} onValueChange={setGroupingVariable}>
                              <SelectTrigger className="mt-2">
                                <SelectValue placeholder="Choose a categorical variable that defines your groups" />
                              </SelectTrigger>
                              <SelectContent>
                                {categoricalVariables.map((variable) => (
                                  <SelectItem key={variable} value={variable}>
                                    {variable.replace(/_/g, ' ')}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label className="text-base font-medium">Outcome variable (numerical)</Label>
                            <Select value={outcomeVariable} onValueChange={setOutcomeVariable}>
                              <SelectTrigger className="mt-2">
                                <SelectValue placeholder="Choose a numerical variable to compare across groups" />
                              </SelectTrigger>
                              <SelectContent>
                                {numericalVariables.map((variable) => (
                                  <SelectItem key={variable} value={variable}>
                                    {variable.replace(/_/g, ' ')}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </>
                      )}
                    </div>
                 ) : (
                  <div className="space-y-3">
                    {selectedVariables.map((variable, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <div className="flex-1">
                          <Label className="text-base font-medium">
                            {comparisonType === "compare-before-after" ? 
                              (index === 0 ? "Before/baseline variable" : "After/follow-up variable") :
                              `${index === 0 ? "First" : index === 1 ? "Second" : `Group ${index + 1}`} group variable`
                            }
                          </Label>
                          <Select value={variable} onValueChange={(value) => updateVariable(index, value)}>
                            <SelectTrigger className="mt-2">
                              <SelectValue placeholder="Choose a variable" />
                            </SelectTrigger>
                             <SelectContent>
                               {numericalVariables.filter(v => !selectedVariables.includes(v) || v === variable).map((availableVar) => (
                                 <SelectItem key={availableVar} value={availableVar}>
                                   {availableVar.replace(/_/g, ' ')}
                                 </SelectItem>
                               ))}
                             </SelectContent>
                          </Select>
                        </div>
                         {comparisonType === "compare-groups" && selectedVariables.length > 2 && (
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
                     
                     {comparisonType === "compare-groups" && (
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

                {comparisonType === "compare-to-target" && (
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

                {comparisonType !== "compare-groups" || selectedVariables.filter(v => v).length === 2 ? (
                  <div>
                    <Label className="text-base font-medium">Research question</Label>
                    <Select value={alternative} onValueChange={setAlternative}>
                      <SelectTrigger className="mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="two-sided">
                          {comparisonType === "compare-to-target" ? "Is there any difference from target?" :
                           comparisonType === "compare-before-after" ? "Is there any change?" :
                           "Are the groups different?"}
                        </SelectItem>
                        <SelectItem value="greater">
                          {comparisonType === "compare-to-target" ? "Is the variable higher than target?" :
                           comparisonType === "compare-before-after" ? "Did values increase?" :
                           "Is first group higher?"}
                        </SelectItem>
                        <SelectItem value="less">
                          {comparisonType === "compare-to-target" ? "Is the variable lower than target?" :
                           comparisonType === "compare-before-after" ? "Did values decrease?" :
                           "Is first group lower?"}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                ) : null}
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
                   {comparisonType === "compare-to-target" && "Compare your variable's average to a specific target or benchmark value."}
                   {comparisonType === "compare-before-after" && "Analyze changes in the same subjects measured at two different times."}
                   {comparisonType === "compare-groups" && "Compare a numerical variable across different groups defined by a categorical variable (e.g., compare test scores between male vs female students)."}
                   {comparisonType === "compare-different-variables" && "Compare different variables or metrics from your dataset."}
                 </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                {comparisonType === "compare-to-target" && selectedVariables[0] && targetValue
                  ? `Testing if ${selectedVariables[0].replace(/_/g, ' ').toLowerCase()} differs from ${targetValue}`
                  : comparisonType === "compare-before-after" && selectedVariables[0] && selectedVariables[1]
                  ? `Testing changes from ${selectedVariables[0].replace(/_/g, ' ').toLowerCase()} to ${selectedVariables[1].replace(/_/g, ' ').toLowerCase()}`
                  : comparisonType === "compare-groups" && groupingVariable && outcomeVariable
                  ? `Testing ${outcomeVariable.replace(/_/g, ' ').toLowerCase()} differences by ${groupingVariable.replace(/_/g, ' ').toLowerCase()}`
                  : "Analysis Results"}
              </h1>
              <p className="text-muted-foreground mt-2">
                {results.testUsed} • {(1 - results.alpha) * 100}% confidence level
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => setResults(null)}
            >
              ← Back
            </Button>
          </div>

          {/* Key Finding Banner */}
          <Card className="border-l-4 border-l-primary">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 mb-4">
                <Badge variant={results.isSignificant ? "destructive" : "secondary"} className="text-sm">
                  {results.isSignificant ? "Statistically Significant" : "Not Significant"}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  p-value: {results.pValue < 0.001 ? "<0.001" : results.pValue.toFixed(3)}
                </span>
              </div>
              
              <TooltipProvider>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  {comparisonType === "compare-to-target" && (
                    <>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="text-center p-4 bg-primary/5 rounded-lg cursor-help">
                            <div className="text-2xl font-bold text-primary">{results.sampleMean?.toFixed(2) || results.mean1?.toFixed(2)}</div>
                            <div className="text-sm text-muted-foreground">Sample average</div>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>The calculated average of your sample data</p>
                        </TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="text-center p-4 bg-secondary/5 rounded-lg cursor-help">
                            <div className="text-2xl font-bold text-secondary-foreground">{targetValue}</div>
                            <div className="text-sm text-muted-foreground">Target value</div>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>The benchmark value you're comparing against</p>
                        </TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="text-center p-4 bg-accent/5 rounded-lg cursor-help">
                            <div className="text-2xl font-bold text-accent-foreground">{results.effectSize?.toFixed(2)}</div>
                            <div className="text-sm text-muted-foreground">Effect size</div>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Measures the practical significance of the difference (Cohen's d)</p>
                        </TooltipContent>
                      </Tooltip>
                    </>
                  )}
                  
                   {comparisonType === "compare-groups" && results.testType === "anova" && (
                     <>
                       <Tooltip>
                         <TooltipTrigger asChild>
                           <div className="text-center p-4 bg-primary/5 rounded-lg cursor-help">
                             <div className="text-2xl font-bold text-primary">{results.groupMeans?.length}</div>
                             <div className="text-sm text-muted-foreground">Groups compared</div>
                           </div>
                         </TooltipTrigger>
                         <TooltipContent>
                           <p>Number of different groups in the analysis</p>
                         </TooltipContent>
                       </Tooltip>
                       <Tooltip>
                         <TooltipTrigger asChild>
                           <div className="text-center p-4 bg-secondary/5 rounded-lg cursor-help">
                             <div className="text-2xl font-bold text-secondary-foreground">{results.fStatistic?.toFixed(2)}</div>
                             <div className="text-sm text-muted-foreground">F-statistic</div>
                           </div>
                         </TooltipTrigger>
                         <TooltipContent>
                           <p>Test statistic comparing variance between groups to variance within groups</p>
                         </TooltipContent>
                       </Tooltip>
                       <Tooltip>
                         <TooltipTrigger asChild>
                           <div className="text-center p-4 bg-accent/5 rounded-lg cursor-help">
                             <div className="text-2xl font-bold text-accent-foreground">{results.etaSquared?.toFixed(3)}</div>
                             <div className="text-sm text-muted-foreground">Effect size (η²)</div>
                           </div>
                         </TooltipTrigger>
                         <TooltipContent>
                           <p>Proportion of total variance explained by group differences (eta-squared)</p>
                         </TooltipContent>
                       </Tooltip>
                     </>
                   )}

                   {comparisonType === "compare-groups" && results.testType !== "anova" && (
                    <>
                       <Tooltip>
                         <TooltipTrigger asChild>
                           <div className="text-center p-4 bg-primary/5 rounded-lg cursor-help">
                             <div className="text-2xl font-bold text-primary">{results.mean1?.toFixed(2)}</div>
                             <div className="text-sm text-muted-foreground">{results.groupNames?.[0]?.replace(/_/g, ' ') || "Group 1"} average</div>
                           </div>
                         </TooltipTrigger>
                         <TooltipContent>
                           <p>Average value for the first group</p>
                         </TooltipContent>
                       </Tooltip>
                       <Tooltip>
                         <TooltipTrigger asChild>
                           <div className="text-center p-4 bg-secondary/5 rounded-lg cursor-help">
                             <div className="text-2xl font-bold text-secondary-foreground">{results.mean2?.toFixed(2)}</div>
                             <div className="text-sm text-muted-foreground">{results.groupNames?.[1]?.replace(/_/g, ' ') || "Group 2"} average</div>
                           </div>
                         </TooltipTrigger>
                         <TooltipContent>
                           <p>Average value for the second group</p>
                         </TooltipContent>
                       </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="text-center p-4 bg-accent/5 rounded-lg cursor-help">
                            <div className="text-2xl font-bold text-accent-foreground">{results.effectSize?.toFixed(2)}</div>
                            <div className="text-sm text-muted-foreground">Effect size</div>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Measures the practical significance of the difference (Cohen's d)</p>
                        </TooltipContent>
                      </Tooltip>
                    </>
                  )}

                  {comparisonType === "compare-before-after" && (
                    <>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="text-center p-4 bg-primary/5 rounded-lg cursor-help">
                            <div className="text-2xl font-bold text-primary">
                              {results.meanDifference > 0 ? '+' : ''}{results.meanDifference?.toFixed(2)}
                            </div>
                            <div className="text-sm text-muted-foreground">Average change</div>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Mean difference between before and after measurements</p>
                        </TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="text-center p-4 bg-secondary/5 rounded-lg cursor-help">
                            <div className="text-2xl font-bold text-secondary-foreground">{results.tStatistic?.toFixed(2)}</div>
                            <div className="text-sm text-muted-foreground">t-statistic</div>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Test statistic measuring how many standard errors the difference is from zero</p>
                        </TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="text-center p-4 bg-accent/5 rounded-lg cursor-help">
                            <div className="text-2xl font-bold text-accent-foreground">{results.effectSize?.toFixed(2)}</div>
                            <div className="text-sm text-muted-foreground">Effect size</div>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Measures the practical significance of the change (Cohen's d)</p>
                        </TooltipContent>
                      </Tooltip>
                    </>
                  )}
                </div>
              </TooltipProvider>
              
              {/* Headline */}
              <div className="bg-primary/5 p-4 rounded-lg border-l-4 border-l-primary mb-4">
                <h3 className="font-semibold text-primary mb-2">Headline</h3>
                <div className="text-sm leading-relaxed">
                  {results.headline}
                </div>
              </div>

              {/* Summary and Technical Details Side by Side */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Summary Section */}
                <div className="bg-muted/50 p-4 rounded-lg">
                  <h3 className="font-semibold text-foreground mb-2">Summary</h3>
                  <div className="text-sm leading-relaxed space-y-2">
                    <p>
                      {results.isSignificant 
                        ? `The statistical analysis detected a significant ${
                            comparisonType === "compare-to-target" ? "difference from the target value" :
                            comparisonType === "compare-before-after" ? "change between time points" :
                            "difference between groups"
                          } (p = ${results.pValue < 0.001 ? "<0.001" : results.pValue.toFixed(3)}).`
                        : `The statistical analysis did not detect a significant ${
                            comparisonType === "compare-to-target" ? "difference from the target value" :
                            comparisonType === "compare-before-after" ? "change between time points" :
                            "difference between groups"
                          } (p = ${results.pValue.toFixed(3)}).`
                      }
                    </p>
                    <p>
                      {results.effectSize && `The effect size (Cohen's d = ${results.effectSize.toFixed(2)}) indicates a ${
                        Math.abs(results.effectSize) < 0.2 ? "small" :
                        Math.abs(results.effectSize) < 0.5 ? "small to medium" :
                        Math.abs(results.effectSize) < 0.8 ? "medium to large" : "large"
                      } practical difference.`}
                      {results.etaSquared && `The analysis explains ${(results.etaSquared * 100).toFixed(1)}% of the variance in the outcome variable.`}
                    </p>
                  </div>
                </div>

                {/* Technical Details */}
                <div className="bg-secondary/5 p-4 rounded-lg">
                  <h3 className="font-semibold text-foreground mb-2">Technical Details</h3>
                  <div className="text-sm leading-relaxed whitespace-pre-line space-y-2">
                    <div>{results.technicalDescription}</div>
                    {results.confidenceInterval && (
                      <div className="mt-3 pt-3 border-t border-border">
                        <p><strong>Confidence Interval ({(1 - results.alpha) * 100}%):</strong></p>
                        <p>[{results.confidenceInterval[0].toFixed(3)}, {results.confidenceInterval[1].toFixed(3)}]</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          We are {(1 - results.alpha) * 100}% confident the true {
                            comparisonType === "compare-to-target" ? "population mean" :
                            comparisonType === "compare-before-after" ? "mean difference" :
                            "difference between groups"
                          } falls within this range.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Visualization */}
          <TTestVisualization 
            results={results}
            testType={results.testType === "anova" ? "anova" : 
                     comparisonType === "compare-before-after" ? "paired" : 
                     comparisonType === "compare-to-target" ? "one-sample" : "two-sample"}
          />
        </div>
      )}
    </div>
  );
};

export default TTestDashboard;

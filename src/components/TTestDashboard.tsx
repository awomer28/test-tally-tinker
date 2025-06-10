
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, Users, Activity, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import OneSampleTest from "./OneSampleTest";
import TwoSampleTest from "./TwoSampleTest";
import PairedTest from "./PairedTest";

const TTestDashboard = () => {
  const [selectedAnalysis, setSelectedAnalysis] = useState<string | null>(null);

  const analysisOptions = [
    {
      id: "compare-groups",
      title: "Compare Two Groups",
      description: "Test if two groups have different average values",
      examples: "Compare income between regions, test drug effectiveness vs placebo, compare student scores",
      icon: Users,
      component: "two-sample"
    },
    {
      id: "before-after",
      title: "Before & After Analysis",
      description: "Test if there's a change after an intervention",
      examples: "Policy impact analysis, treatment effects, training program outcomes",
      icon: Activity,
      component: "paired"
    },
    {
      id: "benchmark-test",
      title: "Compare to a Target Value",
      description: "Test if your data differs from a known standard or target",
      examples: "Test if average exceeds regulatory limit, compare to industry benchmark",
      icon: Upload,
      component: "one-sample"
    }
  ];

  if (!selectedAnalysis) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
            Statistical Analysis Tool
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Choose the type of analysis that matches your research question. We'll guide you through the process step by step.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-3">
          {analysisOptions.map((option) => {
            const IconComponent = option.icon;
            return (
              <Card 
                key={option.id} 
                className="cursor-pointer hover:shadow-lg transition-shadow border-2 hover:border-blue-200"
                onClick={() => setSelectedAnalysis(option.component)}
              >
                <CardHeader className="text-center">
                  <div className="mx-auto w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mb-4">
                    <IconComponent className="w-6 h-6 text-blue-600" />
                  </div>
                  <CardTitle className="text-xl">{option.title}</CardTitle>
                  <CardDescription className="text-base">
                    {option.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-muted-foreground mb-4">
                    <strong>Examples:</strong> {option.examples}
                  </div>
                  <Button className="w-full">
                    Start Analysis <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="mt-12 p-6 bg-blue-50 rounded-lg">
          <h3 className="text-lg font-semibold mb-2">How it works:</h3>
          <div className="grid md:grid-cols-3 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">1</div>
              <span>Choose your analysis type</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">2</div>
              <span>Enter your data or select variables</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">3</div>
              <span>Get results with plain-English interpretation</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-6">
        <Button 
          variant="outline" 
          onClick={() => setSelectedAnalysis(null)}
          className="mb-4"
        >
          ← Back to Analysis Selection
        </Button>
        
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">
            {analysisOptions.find(opt => opt.component === selectedAnalysis)?.title}
          </h1>
          <p className="text-muted-foreground">
            {analysisOptions.find(opt => opt.component === selectedAnalysis)?.description}
          </p>
        </div>
      </div>

      <Tabs value={selectedAnalysis} className="w-full">
        <TabsContent value="two-sample">
          <Card className="border-0 shadow-lg bg-white/70 backdrop-blur-sm">
            <CardContent className="pt-6">
              <TwoSampleTest />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="paired">
          <Card className="border-0 shadow-lg bg-white/70 backdrop-blur-sm">
            <CardContent className="pt-6">
              <PairedTest />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="one-sample">
          <Card className="border-0 shadow-lg bg-white/70 backdrop-blur-sm">
            <CardContent className="pt-6">
              <OneSampleTest />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TTestDashboard;


import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calculator, BarChart3, TrendingUp } from "lucide-react";
import OneSampleTest from "./OneSampleTest";
import TwoSampleTest from "./TwoSampleTest";
import PairedTest from "./PairedTest";

const TTestDashboard = () => {
  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
          Interactive T-Test Dashboard
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Perform statistical t-tests with real-time calculations and visualizations. 
          Perfect for research, education, and data analysis.
        </p>
      </div>

      <Tabs defaultValue="one-sample" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-8">
          <TabsTrigger value="one-sample" className="flex items-center gap-2">
            <Calculator className="w-4 h-4" />
            One-Sample
          </TabsTrigger>
          <TabsTrigger value="two-sample" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Two-Sample
          </TabsTrigger>
          <TabsTrigger value="paired" className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Paired
          </TabsTrigger>
        </TabsList>

        <TabsContent value="one-sample">
          <Card className="border-0 shadow-lg bg-white/70 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="w-5 h-5 text-blue-600" />
                One-Sample T-Test
              </CardTitle>
              <CardDescription>
                Compare a sample mean to a known population mean or hypothesized value.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <OneSampleTest />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="two-sample">
          <Card className="border-0 shadow-lg bg-white/70 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-green-600" />
                Two-Sample T-Test
              </CardTitle>
              <CardDescription>
                Compare the means of two independent groups to test for significant differences.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TwoSampleTest />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="paired">
          <Card className="border-0 shadow-lg bg-white/70 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-purple-600" />
                Paired T-Test
              </CardTitle>
              <CardDescription>
                Compare paired observations (before/after, matched pairs) to detect changes.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PairedTest />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TTestDashboard;

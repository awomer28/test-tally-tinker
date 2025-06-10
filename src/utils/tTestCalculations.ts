
// Statistical calculation utilities for t-tests

export function calculateOneSampleTTest(
  data: number[], 
  populationMean: number, 
  alpha: number, 
  alternative: string
) {
  const n = data.length;
  const sampleMean = data.reduce((sum, x) => sum + x, 0) / n;
  const sampleStd = Math.sqrt(
    data.reduce((sum, x) => sum + Math.pow(x - sampleMean, 2), 0) / (n - 1)
  );
  const standardError = sampleStd / Math.sqrt(n);
  const tStatistic = (sampleMean - populationMean) / standardError;
  const df = n - 1;
  
  const criticalValue = getTCriticalValue(alpha, df, alternative);
  const pValue = getTTestPValue(tStatistic, df, alternative);
  const isSignificant = pValue < alpha;
  
  // Confidence interval
  const marginOfError = criticalValue * standardError;
  const confidenceInterval = [
    sampleMean - marginOfError,
    sampleMean + marginOfError
  ];
  
  const interpretation = generateInterpretation(
    isSignificant, 
    pValue, 
    alpha, 
    alternative,
    "one-sample",
    { sampleMean, populationMean }
  );
  
  return {
    n,
    sampleMean,
    sampleStd,
    tStatistic,
    df,
    pValue,
    criticalValue,
    isSignificant,
    alpha,
    alternative,
    confidenceInterval,
    interpretation
  };
}

export function calculateTwoSampleTTest(
  data1: number[], 
  data2: number[], 
  alpha: number, 
  alternative: string, 
  equalVariances: boolean = true
) {
  const n1 = data1.length;
  const n2 = data2.length;
  const mean1 = data1.reduce((sum, x) => sum + x, 0) / n1;
  const mean2 = data2.reduce((sum, x) => sum + x, 0) / n2;
  
  const var1 = data1.reduce((sum, x) => sum + Math.pow(x - mean1, 2), 0) / (n1 - 1);
  const var2 = data2.reduce((sum, x) => sum + Math.pow(x - mean2, 2), 0) / (n2 - 1);
  
  let tStatistic: number;
  let df: number;
  let standardError: number;
  
  if (equalVariances) {
    // Pooled variance t-test
    const pooledVariance = ((n1 - 1) * var1 + (n2 - 1) * var2) / (n1 + n2 - 2);
    standardError = Math.sqrt(pooledVariance * (1/n1 + 1/n2));
    df = n1 + n2 - 2;
  } else {
    // Welch's t-test
    standardError = Math.sqrt(var1/n1 + var2/n2);
    df = Math.pow(var1/n1 + var2/n2, 2) / 
         (Math.pow(var1/n1, 2)/(n1-1) + Math.pow(var2/n2, 2)/(n2-1));
  }
  
  tStatistic = (mean1 - mean2) / standardError;
  
  const criticalValue = getTCriticalValue(alpha, df, alternative);
  const pValue = getTTestPValue(tStatistic, df, alternative);
  const isSignificant = pValue < alpha;
  
  // Effect size (Cohen's d)
  const pooledStd = Math.sqrt(((n1 - 1) * var1 + (n2 - 1) * var2) / (n1 + n2 - 2));
  const effectSize = (mean1 - mean2) / pooledStd;
  
  const interpretation = generateInterpretation(
    isSignificant, 
    pValue, 
    alpha, 
    alternative,
    "two-sample",
    { mean1, mean2, effectSize }
  );
  
  return {
    n1,
    n2,
    mean1,
    mean2,
    tStatistic,
    df,
    pValue,
    criticalValue,
    isSignificant,
    alpha,
    alternative,
    effectSize,
    interpretation
  };
}

export function calculatePairedTTest(
  before: number[], 
  after: number[], 
  alpha: number, 
  alternative: string
) {
  if (before.length !== after.length) {
    throw new Error("Before and after data must have the same length");
  }
  
  const differences = before.map((b, i) => b - after[i]);
  const n = differences.length;
  const meanDifference = differences.reduce((sum, d) => sum + d, 0) / n;
  const stdDifference = Math.sqrt(
    differences.reduce((sum, d) => sum + Math.pow(d - meanDifference, 2), 0) / (n - 1)
  );
  
  const standardError = stdDifference / Math.sqrt(n);
  const tStatistic = meanDifference / standardError;
  const df = n - 1;
  
  const criticalValue = getTCriticalValue(alpha, df, alternative);
  const pValue = getTTestPValue(tStatistic, df, alternative);
  const isSignificant = pValue < alpha;
  
  // Effect size (Cohen's d for paired samples)
  const effectSize = meanDifference / stdDifference;
  
  // Confidence interval for mean difference
  const marginOfError = criticalValue * standardError;
  const confidenceInterval = [
    meanDifference - marginOfError,
    meanDifference + marginOfError
  ];
  
  const interpretation = generateInterpretation(
    isSignificant, 
    pValue, 
    alpha, 
    alternative,
    "paired",
    { meanDifference, effectSize }
  );
  
  return {
    n,
    meanDifference,
    stdDifference,
    tStatistic,
    df,
    pValue,
    criticalValue,
    isSignificant,
    alpha,
    alternative,
    effectSize,
    confidenceInterval,
    interpretation
  };
}

function getTCriticalValue(alpha: number, df: number, alternative: string): number {
  // Simplified critical value calculation
  // In a real application, you'd use a proper t-table or statistical library
  const alphaForLookup = alternative === "two-sided" ? alpha / 2 : alpha;
  
  // Approximate critical values for common scenarios
  if (df >= 30) {
    // Use normal approximation for large df
    if (alphaForLookup <= 0.005) return 2.576;
    if (alphaForLookup <= 0.025) return 1.96;
    if (alphaForLookup <= 0.05) return 1.645;
    return 1.282;
  }
  
  // Approximate t-critical values for smaller df
  const tTable: { [key: number]: { [key: number]: number } } = {
    1: { 0.05: 6.314, 0.025: 12.706, 0.005: 63.657 },
    2: { 0.05: 2.920, 0.025: 4.303, 0.005: 9.925 },
    3: { 0.05: 2.353, 0.025: 3.182, 0.005: 5.841 },
    4: { 0.05: 2.132, 0.025: 2.776, 0.005: 4.604 },
    5: { 0.05: 2.015, 0.025: 2.571, 0.005: 4.032 },
    10: { 0.05: 1.812, 0.025: 2.228, 0.005: 3.169 },
    15: { 0.05: 1.753, 0.025: 2.131, 0.005: 2.947 },
    20: { 0.05: 1.725, 0.025: 2.086, 0.005: 2.845 },
    25: { 0.05: 1.708, 0.025: 2.060, 0.005: 2.787 }
  };
  
  // Find closest df in table
  const availableDf = Object.keys(tTable).map(Number).sort((a, b) => a - b);
  const closestDf = availableDf.reduce((prev, curr) => 
    Math.abs(curr - df) < Math.abs(prev - df) ? curr : prev
  );
  
  // Find closest alpha
  const availableAlpha = Object.keys(tTable[closestDf]).map(Number);
  const closestAlpha = availableAlpha.reduce((prev, curr) => 
    Math.abs(curr - alphaForLookup) < Math.abs(prev - alphaForLookup) ? curr : prev
  );
  
  return tTable[closestDf][closestAlpha] || 1.96;
}

function getTTestPValue(tStat: number, df: number, alternative: string): number {
  // Simplified p-value calculation
  // This is an approximation - in practice you'd use a proper statistical library
  const absTStat = Math.abs(tStat);
  
  // Rough approximation using normal distribution for large df
  if (df >= 30) {
    const z = absTStat;
    let p = 1 - normalCDF(z);
    return alternative === "two-sided" ? 2 * p : p;
  }
  
  // Very rough approximation for t-distribution
  // This should be replaced with proper implementation
  const approximateP = Math.exp(-0.717 * absTStat - 0.416 * Math.pow(absTStat, 2));
  const adjustedP = Math.min(0.5, Math.max(0.001, approximateP));
  
  return alternative === "two-sided" ? 2 * adjustedP : adjustedP;
}

function normalCDF(x: number): number {
  // Approximation of normal CDF
  const t = 1 / (1 + 0.2316419 * Math.abs(x));
  const d = 0.3989423 * Math.exp(-x * x / 2);
  const prob = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
  return x > 0 ? 1 - prob : prob;
}

function generateInterpretation(
  isSignificant: boolean, 
  pValue: number, 
  alpha: number, 
  alternative: string,
  testType: string,
  stats: any
): string {
  const significance = isSignificant ? "significant" : "not significant";
  const direction = alternative === "two-sided" ? "different from" : 
                   alternative === "greater" ? "greater than" : "less than";
  
  let baseMessage = `The test result is ${significance} (p = ${pValue.toFixed(4)}, α = ${alpha}).`;
  
  if (testType === "one-sample") {
    baseMessage += ` The sample mean (${stats.sampleMean.toFixed(3)}) is ${significance === "significant" ? "" : "not "}significantly ${direction} the hypothesized population mean (${stats.populationMean}).`;
  } else if (testType === "two-sample") {
    const effectDesc = Math.abs(stats.effectSize) < 0.2 ? "small" : 
                      Math.abs(stats.effectSize) < 0.5 ? "medium" : "large";
    baseMessage += ` Group 1 mean (${stats.mean1.toFixed(3)}) is ${significance === "significant" ? "" : "not "}significantly ${direction} Group 2 mean (${stats.mean2.toFixed(3)}). Effect size: ${effectDesc} (d = ${stats.effectSize.toFixed(3)}).`;
  } else if (testType === "paired") {
    const effectDesc = Math.abs(stats.effectSize) < 0.2 ? "small" : 
                      Math.abs(stats.effectSize) < 0.5 ? "medium" : "large";
    baseMessage += ` The mean difference (${stats.meanDifference.toFixed(3)}) is ${significance === "significant" ? "" : "not "}significantly different from zero. Effect size: ${effectDesc} (d = ${stats.effectSize.toFixed(3)}).`;
  }
  
  return baseMessage;
}

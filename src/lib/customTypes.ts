export type DividendFrequency = 'monthly' | 'quarterly' | 'annually';

export type CashOption = {
  id: string;
  name: string;
  carPrice: number;
};

export type FinancingOption = {
  id: string;
  name: string;
  carPrice: number;
  downPayment: number;
  loanTermMonths: number;
  apr: number; // stored as percentage e.g. 6.5 means 6.5%
};

export type GlobalInputs = {
  availableSavings: number;
  monthlyBudget: number;
  investmentReturnPct: number; // annual %, e.g. 7 means 7%
  expenseRatioPct: number;     // annual %, e.g. 0.05 means 0.05%
  dividendYieldPct: number;    // annual %, e.g. 1.5 means 1.5%
  dividendFrequency: DividendFrequency;
  capitalGainsTaxRatePct: number; // e.g. 23.8 means 23.8%
  timeHorizonYears: number;
};

export type MonthlyDataPoint = {
  month: number;
  date: string;
  investmentBalance: number;
  loanBalance: number;
  netWealth: number;
  afterTaxNetWealth: number;
  loanPayment: number;
  investmentContribution: number;
  cumulativeInterest: number;
};

export type ScenarioResult = {
  id: string;
  name: string;
  isCash: boolean;
  carPrice: number;
  monthlyPayment: number;
  totalInterestPaid: number;
  loanPaidOffMonth: number | null;
  isValid: boolean;
  validationError?: string;
  data: MonthlyDataPoint[];
};

export type ChartViewMode = 'netWealth' | 'afterTaxNetWealth' | 'investmentBalance';

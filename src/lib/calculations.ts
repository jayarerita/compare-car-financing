import { CashOption, FinancingOption, GlobalInputs, MonthlyDataPoint, ScenarioResult } from './customTypes';

export function calcMonthlyPayment(principal: number, aprPct: number, termMonths: number): number {
  if (principal <= 0) return 0;
  if (aprPct === 0) return principal / termMonths;
  const r = aprPct / 100 / 12;
  return (principal * r * Math.pow(1 + r, termMonths)) / (Math.pow(1 + r, termMonths) - 1);
}

function getDateLabel(monthOffset: number): string {
  const d = new Date();
  d.setMonth(d.getMonth() + monthOffset, 1);
  return `${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
}

function dividendsThisMonth(
  balance: number,
  yieldPct: number,
  frequency: string,
  month: number
): number {
  if (frequency === 'monthly') return balance * (yieldPct / 100 / 12);
  if (frequency === 'quarterly' && month % 3 === 0) return balance * (yieldPct / 100 / 4);
  if (frequency === 'annually' && month % 12 === 0) return balance * (yieldPct / 100);
  return 0;
}

// Car depreciation model (new vehicle, nominal value):
//   Year 1: 20% annual rate (off-the-lot penalty)
//   Years 2–5: 15% annual rate (standard mid-life decline)
//   Year 6+: 5% annual rate (mature/stable phase)
//   Floor: 10% of purchase price (approximate salvage value)
export function carValueAtMonth(carPrice: number, month: number): number {
  const floor = carPrice * 0.10;
  const phase1Months = Math.min(month, 12);
  const phase2Months = Math.min(Math.max(month - 12, 0), 48);
  const phase3Months = Math.max(month - 60, 0);

  let value = carPrice;
  value *= Math.pow(1 - 0.20, phase1Months / 12);
  value *= Math.pow(1 - 0.15, phase2Months / 12);
  value *= Math.pow(1 - 0.05, phase3Months / 12);

  return Math.max(value, floor);
}

function simulate(
  id: string,
  name: string,
  isCash: boolean,
  carPrice: number,
  startingInvestment: number,
  startingLoan: number,
  loanAprPct: number,
  monthlyLoanPayment: number,
  inputs: GlobalInputs
): ScenarioResult {
  const {
    monthlyBudget,
    investmentReturnPct,
    expenseRatioPct,
    dividendYieldPct,
    dividendFrequency,
    capitalGainsTaxRatePct,
    timeHorizonYears,
  } = inputs;

  const totalMonths = timeHorizonYears * 12;
  const monthlyGrowthRate = (investmentReturnPct - expenseRatioPct) / 100 / 12;
  const taxRate = capitalGainsTaxRatePct / 100;

  let investBalance = startingInvestment;
  let loanBalance = startingLoan;
  let costBasis = startingInvestment; // track basis for accurate after-tax calc
  let cumulativeInterest = 0;
  let totalInterestPaid = 0;
  let loanPaidOffMonth: number | null = loanBalance <= 0 ? 0 : null;

  const afterTax = (balance: number, basis: number) => {
    const gains = Math.max(0, balance - basis);
    return balance - gains * taxRate;
  };

  const data: MonthlyDataPoint[] = [];

  data.push({
    month: 0,
    date: getDateLabel(0),
    investmentBalance: investBalance,
    loanBalance: loanBalance,
    netWealth: investBalance - loanBalance,
    afterTaxNetWealth: afterTax(investBalance, costBasis),
    loanPayment: 0,
    investmentContribution: 0,
    cumulativeInterest: 0,
  });

  for (let m = 1; m <= totalMonths; m++) {
    investBalance = investBalance * (1 + monthlyGrowthRate);
    investBalance += dividendsThisMonth(investBalance, dividendYieldPct, dividendFrequency, m);

    let loanPaymentThisMonth = 0;
    let investContrib = monthlyBudget;

    if (loanBalance > 0) {
      const interest = loanBalance * (loanAprPct / 100 / 12);
      const principal = Math.min(monthlyLoanPayment - interest, loanBalance);
      loanPaymentThisMonth = interest + principal;
      cumulativeInterest += interest;
      totalInterestPaid += interest;
      loanBalance = Math.max(0, loanBalance - principal);

      if (loanBalance < 0.01) {
        loanBalance = 0;
        if (loanPaidOffMonth === null) loanPaidOffMonth = m;
      }

      // invest whatever's left after loan payment
      investContrib = Math.max(0, monthlyBudget - monthlyLoanPayment);
    }

    investBalance += investContrib;
    costBasis += investContrib;

    data.push({
      month: m,
      date: getDateLabel(m),
      investmentBalance: investBalance,
      loanBalance: loanBalance,
      netWealth: investBalance - loanBalance,
      afterTaxNetWealth: afterTax(investBalance, costBasis),
      loanPayment: loanPaymentThisMonth,
      investmentContribution: investContrib,
      cumulativeInterest,
    });
  }

  return {
    id,
    name,
    isCash,
    carPrice,
    monthlyPayment: monthlyLoanPayment,
    totalInterestPaid,
    loanPaidOffMonth,
    isValid: true,
    data,
  };
}

export function calcCashScenario(cashOption: CashOption, inputs: GlobalInputs): ScenarioResult {
  const { id, carPrice, name } = cashOption;
  const { availableSavings } = inputs;

  if (availableSavings < carPrice) {
    return {
      id,
      name,
      isCash: true,
      carPrice,
      monthlyPayment: 0,
      totalInterestPaid: 0,
      loanPaidOffMonth: null,
      isValid: false,
      validationError: `Savings (${formatCurrency(availableSavings)}) are less than the car price (${formatCurrency(carPrice)})`,
      data: [],
    };
  }

  return simulate(id, name, true, carPrice, availableSavings - carPrice, 0, 0, 0, inputs);
}

export function calcFinancingScenario(option: FinancingOption, inputs: GlobalInputs): ScenarioResult {
  const { carPrice } = option;
  const { availableSavings } = inputs;

  if (option.downPayment > carPrice) {
    return {
      id: option.id,
      name: option.name,
      isCash: false,
      carPrice,
      monthlyPayment: 0,
      totalInterestPaid: 0,
      loanPaidOffMonth: null,
      isValid: false,
      validationError: 'Down payment exceeds car price.',
      data: [],
    };
  }

  if (option.downPayment > availableSavings) {
    return {
      id: option.id,
      name: option.name,
      isCash: false,
      carPrice,
      monthlyPayment: 0,
      totalInterestPaid: 0,
      loanPaidOffMonth: null,
      isValid: false,
      validationError: `Down payment (${formatCurrency(option.downPayment)}) exceeds available savings (${formatCurrency(availableSavings)}).`,
      data: [],
    };
  }

  const loanPrincipal = carPrice - option.downPayment;
  const payment = calcMonthlyPayment(loanPrincipal, option.apr, option.loanTermMonths);
  const startingInvestment = availableSavings - option.downPayment;

  return simulate(
    option.id,
    option.name,
    false,
    carPrice,
    startingInvestment,
    loanPrincipal,
    option.apr,
    payment,
    inputs
  );
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);
}

const en = {
    createFinance: "Create finance note",
    failedCreateFinance: "Failed to create finance note. Please try again.",

    balanceLabel: "Balance",
    carryOverLabel: "From last month",
    spentThisMonth: "Spent this month",
    earnedThisMonth: "Earned this month",
    expenseExclSavings: "Excl. savings",
    avgDailyExpense: "Avg. daily spending",
    nonZeroAvgDailyExpense: "Non-zero avg. daily spending",
    savings: "Savings this month",
    savingsLabel: "Savings",
    categoriesTitle: "Spending by category",
    dailyExpensesTitle: "Spending by day",

    emptyTitle: "No transactions yet",
    emptyHint: "This note is a finance dashboard. Add rows to the table above — the cards will update automatically.",
    emptyChart: "No spending by category yet.",
    emptyDaily: "No daily spending yet.",

    settingsGeneral: "General",
    settingsCurrency: "Currency",
    settingsCurrencyDesc: "Currency used on dashboard cards when a note does not set its own currency in frontmatter.",
    settingsCurrencyCustom: "Custom…",
    settingsCustomCurrency: "Custom currency symbol",
    settingsCustomCurrencyDesc: "Shown when the currency is set to \"Custom\".",
    settingsExcludeSavings: "Exclude savings from average",
    settingsExcludeSavingsDesc: "Exclude savings categories from the average daily spending calculation.",
    settingsExtraSavings: "Extra savings categories",
    settingsExtraSavingsDesc: "Comma-separated keywords that are also treated as savings categories.",
    settingsExtraSavingsPlaceholder: "investments, reserve",
    settingsDaysInMonth: "Days in month",
    settingsDaysInMonthDesc: "Used as the divisor for average daily spending when no day column is filled in.",
    settingsBudgetSection: "Budget",
    settingsShowBudget: "Show budget",
    settingsShowBudgetDesc: "Show a separate \"Budget by category\" chart comparing spending to the limits from the note's frontmatter.",
    budgetChartTitle: "Budget by category",
    budgetChartEmpty: "Set limits in the note's frontmatter (budget:) to see how you are doing against the budget.",
    budgetTotalLabel: "Total budget",
    budgetRemaining: "Remaining",
    budgetOver: "Over budget",
    budgetDone: "Goal reached",
};

/** Every locale must provide all keys, so a missing translation fails the type check. */
export type Locale = Record<keyof typeof en, string>;

export const EN: Locale = en;

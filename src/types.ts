import { FrontMatterCache } from "obsidian";

export type TransactionType = "income" | "expense";

export interface Transaction {
    day: number;
    type: TransactionType;
    category: string;
    amount: number;
}

export interface CategoryStat {
    category: string;
    expense: number;
}

export interface FinanceStats {
    totalIncome: number;
    totalExpense: number;
    expenseExclSavings: number;
    savings: number;
    avgDailyExpense: number;
    nonZeroAvgDailyExpense: number;
    count: number;
    categories: CategoryStat[];
}

declare global {
    interface FinanceFrontmatter extends FrontMatterCache {
        finance?: boolean;
        currency?: string;
        savingsCategory?: string | string[];
        totalSavings?: number | string | Array<number | string>;
        carryOver?: number;
    }
}
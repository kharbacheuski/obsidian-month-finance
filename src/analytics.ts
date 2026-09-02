import { CategoryStat, FinanceStats, Transaction } from "./types";

const DEFAULT_SAVINGS = ["сбережен", "накоплен", "savings", "сэйвинг", "сейвинг", "вклад", "инвест", "копилка"];

export interface ComputeStatsOptions {
    savingsCategories?: string[];
}

export function isSavingsCategory(category: string, custom?: string[]): boolean {
    const c = category.trim().toLowerCase();
    const list = [...(custom ?? []), ...DEFAULT_SAVINGS].map((k) => k.trim().toLowerCase()).filter(Boolean);
    return list.some((k) => c.includes(k));
}

export function computeStats(transactions: Transaction[], options?: ComputeStatsOptions): FinanceStats {
    let totalIncome = 0;
    let totalExpense = 0;
    let savings = 0;
    let expenseExclSavings = 0;
    const catMap = new Map<string, CategoryStat>();
    const spendDays = new Set<number>();
    const dayExpense = new Map<number, number>();

    for (const t of transactions) {
        if (t.amount > 0) {
            totalIncome += t.amount;
            continue;
        }

        const amt = -t.amount;
        totalExpense += amt;

        if (isSavingsCategory(t.category, options?.savingsCategories)) {
            savings += amt;
            continue;
        }

        expenseExclSavings += amt;
        if (t.day > 0) spendDays.add(t.day);
        if (t.day >= 1 && t.day <= 31) {
            dayExpense.set(t.day, (dayExpense.get(t.day) ?? 0) + amt);
        }

        let cat = catMap.get(t.category);
        if (!cat) {
            cat = { category: t.category, expense: 0 };
            catMap.set(t.category, cat);
        }
        cat.expense += amt;
    }

    const categories = [...catMap.values()].sort((a, b) => b.expense - a.expense);
    const count = transactions.length;
    const avgDailyExpense = expenseExclSavings / 30;
    const nonZeroAvgDailyExpense = expenseExclSavings / (spendDays.size || 0);

    return { totalIncome, totalExpense, expenseExclSavings, savings, avgDailyExpense, nonZeroAvgDailyExpense, count, categories };
}

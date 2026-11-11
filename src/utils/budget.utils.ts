import { Transaction } from "../types";

export interface BudgetRow {
    category: string;
    spent: number;
    budget: number;
    ratio: number;
    /** Savings budgets are goals ("put aside"), not spending limits. */
        isSavings: boolean;
    }

    function normalizeCategory(category: string): string {
    return category.trim().replace(/^\.+/, "").replace(/\.+$/, "").replace(/\s+/g, " ").toLowerCase();
}

function matchesCategory(category: string, path: string): boolean {
    return category === path || category.startsWith(`${path}.`);
}

/**
 * Builds one row per budget, including budgets without spending yet.
 * A budget on a parent category covers all of its subcategories, so `Food` also
 * matches `Food.Groceries`, while `Food.Groceries` limits only that subcategory.
 */
export function getBudgetRows(
    transactions: Transaction[],
    budgets: Map<string, number> | undefined,
    isSavings: (category: string) => boolean,
): BudgetRow[] {
    if (!budgets?.size) return [];

    // Category normalization and savings detection are done once per transaction,
    // not once per budget.
    const prepared = transactions.map((transaction) => ({
        category: normalizeCategory(transaction.category),
        isSavings: isSavings(transaction.category),
        amount: transaction.amount,
    }));

    const rows: BudgetRow[] = [];

    for (const [key, budget] of budgets) {
        if (!(budget > 0)) continue;

        const name = key.trim();
        const path = normalizeCategory(name);
        if (!path) continue;

        const savingsBudget = isSavings(name);
        let spent = 0;

        for (const transaction of prepared) {
            if (!matchesCategory(transaction.category, path)) continue;

            if (savingsBudget) {
                // Savings are net: contributions add up, withdrawals taken back out subtract.
                if (transaction.isSavings) spent -= transaction.amount;
            } else if (!transaction.isSavings && transaction.amount < 0) {
                spent += -transaction.amount;
            }
        }

        // A budget can only show contributions; a negative net means nothing was put aside.
        if (savingsBudget) spent = Math.max(spent, 0);

        rows.push({ category: name, spent, budget, ratio: spent / budget, isSavings: savingsBudget });
    }

    return rows.sort((a, b) => b.ratio - a.ratio);
}

export function formatBudgetPercent(ratio: number): string {
    return `${Math.round(ratio * 100)}%`;
}

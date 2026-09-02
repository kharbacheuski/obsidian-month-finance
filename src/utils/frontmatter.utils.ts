import { App, Notice, TFile, normalizePath } from "obsidian";
import { CURRENT_LOCALE } from "src/locale";

export async function createFinanceNote(app: App): Promise<TFile | null> {
    try {
        const folder = app.fileManager.getNewFileParent("").path;
        const path = normalizePath(`${folder}/${new Date().toLocaleDateString()}.md`);
        const content = [
            "---",
            "finance: true",
            'currency: "$"',
            "totalSavings:",
            "  - 0.40 ETH",
            "  - 1500 USD",
            "  - 2500 BYN",
            "carryOver: 515",
            `cssclasses: 
              - props-hidden`,
            "---",
            "",
            "| Day | Type | Category | Name | Amount |",
            "| :--: | :--: | :-------- | :------- | ----: |",
            "| 01 | Income | Salary | Monthly salary | 2700 |",
            "| 03 | Expense | Groceries | Weekly groceries | -420 |",
            "| 05 | Expense | Transport | Metro | -20 |",
            "| 07 | Expense | Entertainment | Cinema | -100 |",
            "| 08 | Expense | Savings | Transfer to savings | -250 |",
            "| 10 | Income | Side job | Freelance | 1500 |",
            "",
        ].join("\n");

        return await app.vault.create(path, content);
    } catch (error) {
        console.error(CURRENT_LOCALE.failedCreateFinance, error);
        new Notice(CURRENT_LOCALE.failedCreateFinance);
        return null;
    }
}

import { App, Notice, TFile, normalizePath } from "obsidian";
import { CURRENT_LOCALE } from "../locale";

export async function createFinanceNote(app: App, currency: string): Promise<TFile | null> {
    try {
        const folder = app.fileManager.getNewFileParent("").path;
        // The localized date may contain path separators (e.g. 11/11/2026 on en-US).
        const baseName = new Date().toLocaleDateString().replace(/[\\/:*?"<>|]/g, "-");
        let path = normalizePath(`${folder}/${baseName}.md`);
        let counter = 2;
        while (app.vault.getAbstractFileByPath(path)) {
            path = normalizePath(`${folder}/${baseName} ${counter}.md`);
            counter++;
        }

        const content = [
            "---",
            "finance: true",
            `currency: ${JSON.stringify(currency)}`,
            "totalSavings:",
            "  - 1500 USD",
            "  - 2500 BYN",
            "carryOver: 515",
            "budget:",
            "  Food: 900",
            "  Transport: 120",
            "cssclasses:",
            "  - props-hidden",
            "---",
            "",
            "| Day | Type | Category | Name | Amount |",
            "| :--: | :--: | :-------- | :------- | ----: |",
            "| 01 | Income | Salary | Monthly salary | 2700 |",
            "| 03 | Expense | Food.Groceries | Weekly groceries | -420 |",
            "| 05 | Expense | Transport | Metro | -20 |",
            "| 07 | Expense | Food.Restaurants | Cinema | -100 |",
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

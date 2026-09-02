import { App, MarkdownView, TFile } from "obsidian";
import { CURRENT_LOCALE } from "./locale";
import { FinanceStats } from "./types";
import { computeStats } from "./analytics";
import { parseTransactions } from "./parser";
import { StatCard, StatCardOptions } from "./components/StatCard";
import { CategoryChart } from "./components/CategoryChart";
import { EmptyState } from "./components/EmptyState";

export default class FinanceDashboard {
    private app: App;
    private file: TFile;
    private container: HTMLElement | null = null;
    private stats: FinanceStats | null = null;
    private currency: string = "₽";
    private savingsCategories: string[] | undefined;
    private totalSavings: string[] = [];
    private carryOver = 0;
    private renderId = 0;

    constructor(app: App, file: TFile) {
        this.app = app;
        this.file = file;
    }

    async mount(el: HTMLElement): Promise<void> {
        const table = this.findFinanceTable(el);
        const existing = el.querySelector<HTMLElement>(".finance-dashboard");

        if (existing) {
            this.container = existing;
            if (table && this.container.parentElement === table.parentElement && table.previousSibling !== this.container) {
                table.parentElement!.insertBefore(this.container, table);
            }
        } else {
            this.container = el.createDiv({ cls: "finance-dashboard" });
            if (table?.parentElement) {
                table.parentElement.insertBefore(this.container, table);
            } else {
                el.appendChild(this.container);
            }
        }

        await this.refresh();
    }

    private findFinanceTable(el: HTMLElement): HTMLTableElement | null {
        const tables = Array.from(el.querySelectorAll("table"));
        for (const table of tables) {
            const headerRow = table.querySelector("tr");
            if (!headerRow) continue;
            const headerText = Array.from(headerRow.querySelectorAll("th, td"))
                .map((c) => (c.textContent ?? "").trim().toLowerCase().replace(/\s+/g, ""))
                .join(" ");
            if (headerText.includes("сумма") || headerText.includes("amount") || headerText.includes("sum")) {
                return table as HTMLTableElement;
            }
        }
        return null;
    }

    remove(): void {
        this.container?.remove();
        this.container = null;
    }

    isAttached(): boolean {
        return !!this.container && this.container.isConnected;
    }

    async refresh(): Promise<void> {
        if (!this.container) return;

        const id = ++this.renderId;
        const cache = this.app.metadataCache.getFileCache(this.file);
        const fm = cache?.frontmatter as FinanceFrontmatter | undefined;
        this.currency = fm?.currency || "₽";
        this.savingsCategories = this.parseSavingsCategories(fm?.savingsCategory);
        this.totalSavings = this.parseTotalSavings(fm?.totalSavings);
        this.carryOver = this.parseNumber(fm?.carryOver);

        const content = await this.readContent();
        if (id !== this.renderId) return;

        this.stats = computeStats(parseTransactions(content), { savingsCategories: this.savingsCategories });
        this.render();
    }

    private async readContent(): Promise<string> {
        const view = this.app.workspace.getActiveViewOfType(MarkdownView);
        if (view && view.file === this.file && view.getMode() === "source") {
            return view.editor.getValue();
        }
        return this.app.vault.cachedRead(this.file);
    }

    private parseSavingsCategories(raw: unknown): string[] | undefined {
        if (typeof raw === "string") return [raw];
        if (Array.isArray(raw)) return raw.filter((x): x is string => typeof x === "string");
        return undefined;
    }

    private parseNumber(raw: unknown): number {
        const value = typeof raw === "number" ? raw : parseFloat(String(raw));
        return Number.isFinite(value) ? value : 0;
    }

    private parseTotalSavings(raw: unknown): string[] {
        const items = Array.isArray(raw) ? raw : raw === undefined || raw === null ? [] : [raw];
        const result: string[] = [];
        for (const item of items) {
            const entry = this.formatSavingsEntry(item);
            if (entry) result.push(entry);
        }
        return result;
    }

    private formatSavingsEntry(raw: unknown): string | null {
        if (typeof raw === "number" && Number.isFinite(raw)) {
            return this.formatAmount(raw);
        }
        if (typeof raw === "string") {
            const text = raw.trim();
            if (!text) return null;
            if (/[a-zа-яё]/i.test(text)) return text;
            const amount = parseFloat(text.replace(/[\s\u00a0]/g, ""));
            return Number.isFinite(amount) ? this.formatAmount(amount) : text;
        }
        return null;
    }

    private render(): void {
        if (!this.container) return;
        this.container.empty();

        if (!this.stats || this.stats.count === 0) {
            new EmptyState({
                title: CURRENT_LOCALE.emptyTitle,
                hint: CURRENT_LOCALE.emptyHint,
            }).render(this.container);
            return;
        }

        this.renderOverviewCards();
        this.renderCategoryChart();
    }

    private renderOverviewCards(): void {
        const grid = this.container!.createDiv({ cls: "finance-cards" });

        const balance = this.carryOver + this.stats!.totalIncome - this.stats!.totalExpense;
        const savedThisMonth = this.stats!.savings;

        const cards: StatCardOptions[] = [
            {
                icon: "trending-up",
                label: CURRENT_LOCALE.earnedThisMonth,
                value: this.formatAmount(this.stats!.totalIncome),
                tone: "pos",
            },
            {
                icon: "trending-down",
                label: CURRENT_LOCALE.spentThisMonth,
                value: this.formatAmount(this.stats!.totalExpense),
                tone: "neg",
                sub: `${CURRENT_LOCALE.expenseExclSavings}: ${this.formatAmount(this.stats!.expenseExclSavings)}`,
            },
            {
                icon: "calendar",
                label: CURRENT_LOCALE.avgDailyExpense,
                value: this.formatAmount(this.stats!.avgDailyExpense),
                sub: `${CURRENT_LOCALE.nonZeroAvgDailyExpense}: ${this.formatAmount(this.stats!.nonZeroAvgDailyExpense)}`,
            },
            {
                icon: "wallet",
                label: CURRENT_LOCALE.balanceLabel,
                value: this.formatAmount(balance),
                sub: this.carryOver > 0 ? `${CURRENT_LOCALE.carryOverLabel}: ${this.formatAmount(this.carryOver)}` : undefined,
            },
            {
                icon: "piggy-bank",
                label: CURRENT_LOCALE.totalSavingsLabel,
                value: this.totalSavings.join(" / "),
                sub: savedThisMonth > 0 ? `${CURRENT_LOCALE.savings}: ${this.formatAmount(savedThisMonth)}` : undefined,
            },
        ];

        for (const opts of cards) {
            new StatCard(opts).render(grid);
        }
    }

    private renderCategoryChart(): void {
        new CategoryChart({
            title: CURRENT_LOCALE.categoriesTitle,
            emptyText: CURRENT_LOCALE.emptyChart,
            categories: this.stats!.categories,
            totalExpense: this.stats!.expenseExclSavings,
            formatAmount: (value) => this.formatAmount(value),
        }).render(this.container!);
    }

    private formatAmount(value: number): string {
        const abs = Math.abs(value).toLocaleString("ru-RU", { maximumFractionDigits: 2 });
        const prefix = value < 0 ? "−" : "";
        return `${prefix}${abs} ${this.currency}`;
    }
}

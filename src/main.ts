import { MarkdownView, Plugin, TAbstractFile, TFile } from "obsidian";
import FinanceDashboard from "./FinanceDashboard";
import { CURRENT_LOCALE } from "./locale";
import { createFinanceNote } from "./utils/frontmatter.utils";

export default class FinanceTrackerPlugin extends Plugin {
    private dashboards = new Map<string, FinanceDashboard>();
    private refreshQueue = new Set<string>();

    onload() {
        this.addRibbonIcon("wallet", CURRENT_LOCALE.createFinance, () => {
            void this.createAndOpenFinanceNote();
        });

        this.addCommand({
            id: "create-finance-note",
            name: CURRENT_LOCALE.createFinance,
            callback: () => void this.createAndOpenFinanceNote(),
        });

        this.registerMarkdownPostProcessor((el, ctx) => {
            const view = this.app.workspace.getActiveViewOfType(MarkdownView);
            const state = view?.getState();

            if (state && state.mode == "source") return;

            const file = this.app.vault.getAbstractFileByPath(ctx.sourcePath);
            if (!(file instanceof TFile)) return;

            const cache = this.app.metadataCache.getFileCache(file);
            if (!cache?.frontmatter?.finance) return;

            this.dashboards.get(file.path)?.remove();

            const dashboard = new FinanceDashboard(this.app, file);
            this.dashboards.set(file.path, dashboard);
            void dashboard.mount(el);
        });

        const ensureRendered = (file: TFile | null) => {
            if (!(file instanceof TFile)) return;
            const view = this.app.workspace.getActiveViewOfType(MarkdownView);
            if (!view || view.file !== file) return;
            const cache = this.app.metadataCache.getFileCache(file);
            if (!cache?.frontmatter?.finance) return;
            if (view.getMode() !== "preview") return;

            let attempts = 0;
            const tryRender = () => {
                const dashboardEl = view.contentEl.querySelector<HTMLElement>(".finance-dashboard");
                if (dashboardEl && dashboardEl.childElementCount > 0) return;

                if (attempts++ < 6) {
                    window.setTimeout(tryRender, 60);
                } else {
                    try {
                        view.previewMode.rerender();
                    } catch (error) {
                        console.error("Finance Tracker: failed to re-render preview", error);
                    }
                }
            };
            window.setTimeout(tryRender, 0);
        };

        this.registerEvent(this.app.workspace.on("file-open", ensureRendered));
        this.registerEvent(
            this.app.workspace.on("active-leaf-change", () => {
                ensureRendered(this.app.workspace.getActiveFile());
            }),
        );

        this.registerEvent(this.app.vault.on("modify", (file) => this.queueRefresh(file)));
        this.registerEvent(this.app.metadataCache.on("changed", (file) => this.queueRefresh(file)));
        this.registerEvent(this.app.workspace.on("editor-change", (_editor, info) => this.queueRefresh(info.file)));
    }

    onunload() {
        for (const dashboard of this.dashboards.values()) {
            dashboard.remove();
        }
        this.dashboards.clear();
    }

    private queueRefresh(file: TAbstractFile | null): void {
        if (!(file instanceof TFile)) return;
        if (this.refreshQueue.has(file.path)) return;

        this.refreshQueue.add(file.path);
        window.requestAnimationFrame(() => {
            this.refreshQueue.delete(file.path);
            const dashboard = this.dashboards.get(file.path);
            if (dashboard?.isAttached()) void dashboard.refresh();
        });
    }

    private async createAndOpenFinanceNote() {
        const file = await createFinanceNote(this.app);
        if (!file) return;

        await this.app.workspace.getLeaf(false).openFile(file);
    }
}

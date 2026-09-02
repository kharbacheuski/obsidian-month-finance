export interface EmptyStateOptions {
    title: string;
    hint: string;
}

export class EmptyState {
    private opts: EmptyStateOptions;

    constructor(opts: EmptyStateOptions) {
        this.opts = opts;
    }

    render(parent: HTMLElement): HTMLElement {
        const card = parent.createDiv({ cls: "finance-card finance-empty" });
        card.createDiv({ cls: "finance-empty-title", text: this.opts.title });
        card.createDiv({ cls: "finance-muted", text: this.opts.hint });
        return card;
    }
}

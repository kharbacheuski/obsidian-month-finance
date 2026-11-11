import { App, PluginSettingTab, Setting } from "obsidian";
import type FinanceTrackerPlugin from "./main";
import { CURRENT_LOCALE } from "./locale";

export interface FinanceTrackerSettings {
    currency: string;
    customCurrency: string;
    excludeSavingsFromAverage: boolean;
    extraSavingsCategories: string;
    daysInMonth: number;
    showBudget: boolean;
}

export const DEFAULT_SETTINGS: FinanceTrackerSettings = {
    currency: "BYN",
    customCurrency: "",
    excludeSavingsFromAverage: true,
    extraSavingsCategories: "",
    daysInMonth: 30,
    showBudget: true,
};

const CURRENCY_SYMBOLS: Record<string, string> = {
    BYN: "Br",
    USD: "$",
    EUR: "€",
    RUB: "₽",
};

export function resolveCurrencySymbol(settings: FinanceTrackerSettings): string {
    if (settings.currency === "custom") {
        return settings.customCurrency.trim() || "₽";
    }
    return CURRENCY_SYMBOLS[settings.currency] ?? "₽";
}

export class FinanceSettingTab extends PluginSettingTab {
    private plugin: FinanceTrackerPlugin;

    constructor(app: App, plugin: FinanceTrackerPlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        const { containerEl } = this;
        containerEl.empty();

        new Setting(containerEl).setHeading().setName(CURRENT_LOCALE.settingsGeneral);

        new Setting(containerEl)
            .setName(CURRENT_LOCALE.settingsCurrency)
            .setDesc(CURRENT_LOCALE.settingsCurrencyDesc)
            .addDropdown((dropdown) =>
                dropdown
                    .addOptions({
                        BYN: "BYN (Br)",
                        USD: "USD ($)",
                        EUR: "EUR (€)",
                        RUB: "RUB (₽)",
                        custom: CURRENT_LOCALE.settingsCurrencyCustom,
                    })
                    .setValue(this.plugin.settings.currency)
                    .onChange((value) => this.update("currency", value)),
            );

        new Setting(containerEl)
            .setName(CURRENT_LOCALE.settingsCustomCurrency)
            .setDesc(CURRENT_LOCALE.settingsCustomCurrencyDesc)
            .addText((text) =>
                text
                    .setPlaceholder("₽")
                    .setValue(this.plugin.settings.customCurrency)
                    .onChange((value) => this.update("customCurrency", value)),
            );

        new Setting(containerEl)
            .setName(CURRENT_LOCALE.settingsExcludeSavings)
            .setDesc(CURRENT_LOCALE.settingsExcludeSavingsDesc)
            .addToggle((toggle) =>
                toggle
                    .setValue(this.plugin.settings.excludeSavingsFromAverage)
                    .onChange((value) => this.update("excludeSavingsFromAverage", value)),
            );

        new Setting(containerEl)
            .setName(CURRENT_LOCALE.settingsExtraSavings)
            .setDesc(CURRENT_LOCALE.settingsExtraSavingsDesc)
            .addTextArea((text) =>
                text
                    .setPlaceholder(CURRENT_LOCALE.settingsExtraSavingsPlaceholder)
                    .setValue(this.plugin.settings.extraSavingsCategories)
                    .onChange((value) => this.update("extraSavingsCategories", value)),
            );

        new Setting(containerEl)
            .setName(CURRENT_LOCALE.settingsDaysInMonth)
            .setDesc(CURRENT_LOCALE.settingsDaysInMonthDesc)
            .addText((text) => {
                text.inputEl.type = "number";
                text.inputEl.min = "1";
                text.inputEl.max = "31";
                text.setPlaceholder("30")
                    .setValue(String(this.plugin.settings.daysInMonth))
                    .onChange((value) => {
                        const parsed = parseInt(value, 10);
                        if (!Number.isFinite(parsed) || parsed < 1 || parsed > 31) return;
                        void this.update("daysInMonth", parsed);
                    });
                // Show the stored value again if the input was left invalid or out of range.
                text.inputEl.addEventListener("blur", () => {
                    text.setValue(String(this.plugin.settings.daysInMonth));
                });
            });

        new Setting(containerEl).setHeading().setName(CURRENT_LOCALE.settingsBudgetSection);

        new Setting(containerEl)
            .setName(CURRENT_LOCALE.settingsShowBudget)
            .setDesc(CURRENT_LOCALE.settingsShowBudgetDesc)
            .addToggle((toggle) =>
                toggle
                    .setValue(this.plugin.settings.showBudget)
                    .onChange((value) => this.update("showBudget", value)),
            );
    }

    private async update<K extends keyof FinanceTrackerSettings>(
        key: K,
        value: FinanceTrackerSettings[K],
    ): Promise<void> {
        this.plugin.settings[key] = value;
        await this.plugin.saveSettings();
        await this.plugin.refreshDashboards();
    }
}

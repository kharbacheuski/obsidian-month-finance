import { getLanguage } from "obsidian";
import { EN, type Locale } from "./en";
import { RU } from "./ru";

export type { Locale };

export const Locales: Record<string, Locale> = {
    en: EN,
    ru: RU,
};

const langCode: string = getLanguage()?.toLowerCase()?.split("-")[0] || "en";

export const CURRENT_LOCALE: Locale = Locales[langCode] ?? EN;
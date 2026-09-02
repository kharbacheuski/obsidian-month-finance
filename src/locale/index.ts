import { getLanguage } from "obsidian";
import { EN } from "./en";
import { RU } from "./ru";

export type Locale = typeof EN;

export const Locales: { [k: string]: Locale } = {
    en: EN,
    ru: RU,
};

const langCode: string = getLanguage()?.toLowerCase()?.split("-")[0] || "en";

export const CURRENT_LOCALE: Locale = Locales[langCode];
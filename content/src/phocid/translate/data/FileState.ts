import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import { toError, zustandStorage } from "../Utils.js";
import { parseStringEntries } from "./String.js";

export interface FileState {
    locale: string;
    variant: string;
    sources: StringEntry[];
    translations: Map<string, StringEntry>;

    setLocale: (value: string) => void;
    setVariant: (value: string) => void;
    setSourcesXml: (value: string) => Error;
    setTranslationsXml: (value: string) => Error;
    setTranslation: (value: StringEntry) => void;
}

export interface StringEntry {
    key: string;
    value: string;
    comment: string;
}

export function getDirectoryName(state: FileState): string {
    const locale = state.locale.replaceAll(/[-_]/g, "+");
    const variant = state.variant.replaceAll(/^\++|\++$/g, "");
    switch (`${locale !== ""} ${variant !== ""}`) {
        case "false true":
            return `values-b+${variant}`;
        case "true false":
            return `values-b+${locale}`;
        case "true true":
            return `values-b+${locale}+${variant}`;
        default:
            return null;
    }
}

export const useFileState = create<FileState>()(
    devtools(
        persist(
            (set, get) => ({
                locale: "",
                variant: "",
                sourceXml: "",
                sources: [],

                translations: new Map(),

                setLocale: (value) => set({ locale: value }),
                setVariant: (value) =>
                    set({
                        variant: value.trim().replaceAll(/[^a-zA-Z0-9]/g, "+"),
                    }),
                setSourcesXml: (value) => {
                    try {
                        set({ sources: parseStringEntries(value) });
                        return null;
                    } catch (ex) {
                        console.log(ex);
                        return toError(ex);
                    }
                },
                setTranslationsXml: (value) => {
                    try {
                        set({
                            translations: new Map(
                                parseStringEntries(value).map((x) => [
                                    x.key,
                                    x,
                                ]),
                            ),
                        });
                        return null;
                    } catch (ex) {
                        console.log(ex);
                        return toError(ex);
                    }
                },
                setTranslation: (value) => {
                    if (!value?.key) return;
                    const translations = new Map(get().translations);
                    translations.set(value.key, value);
                    set({ translations: translations });
                },
            }),
            {
                name: "FileState",
                storage: zustandStorage,
            },
        ),
    ),
);

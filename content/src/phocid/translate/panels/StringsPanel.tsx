import { Document } from "flexsearch";
import * as React from "react";
import { ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { useShallow } from "zustand/react/shallow";
import { CollapsibleCard } from "../components/CollapsibleCard.tsx";
import { useFileState } from "../data/FileState.js";
import { useViewState } from "../data/ViewState.js";

type IndexEntry = {
    index: number;
    key: string;
    source: string;
    translation: string;
};

const searchIndex = new Document<IndexEntry>({
    document: {
        id: "index",
        index: ["key", "source", "translation"],
    },
    tokenize: "forward",
});

export function StringsPanel(): ReactNode {
    const [locale, sources, translations] = useFileState(
        useShallow((x) => [x.locale, x.sources, x.translations]),
    );
    const [activeIndex, setActiveIndex] = useViewState(
        useShallow((x) => [x.activeIndex, x.setActiveIndex]),
    );
    const [filter, setFilter] = useState<"all" | "untranslated" | "translated">(
        "all",
    );
    const [query, setQuery] = useState("");

    const ref = useRef<HTMLInputElement>(null);

    const searchResult = useMemo(() => {
        let resultIndices: Set<number>;
        if (query) {
            resultIndices = new Set<number>();
            const result = searchIndex.search(query);
            result.forEach((x) => {
                x.result.forEach((index) => {
                    resultIndices.add(index as number);
                });
            });
        } else {
            resultIndices = null;
        }
        const indexedSources = sources.map(
            ({ key, value }, index): [string, string, number] => [
                key,
                value,
                index,
            ],
        );
        return resultIndices
            ? indexedSources.filter((_, index) => resultIndices.has(index))
            : indexedSources;
    }, [sources, translations, query]);

    const [elements, untranslatedCount] = useMemo(() => {
        const elements = searchResult
            .filter(([key]) =>
                filter === "all"
                    ? true
                    : filter === "untranslated"
                      ? !translations.get(key)?.value
                      : translations.get(key)?.value,
            )
            .map(([key, value, index]) => (
                <tr
                    key={index}
                    onClick={() => setActiveIndex(index)}
                    className={activeIndex === index ? "active-row" : ""}
                    aria-current={activeIndex === index}
                    id={`strings-table-row-${index}`}
                >
                    <td>
                        <div>{index}</div>
                    </td>
                    <td>
                        <div>{key.replaceAll(/_/g, "_\u200b")}</div>
                    </td>
                    <td>
                        <div>{value}</div>
                    </td>
                    <td>
                        <div lang={locale}>
                            {translations.get(key)?.value || "🚧"}
                        </div>
                    </td>
                </tr>
            ));
        return [
            elements,
            searchResult.filter(([key]) => !translations.get(key)?.value)
                .length,
        ];
    }, [locale, sources, translations, query, activeIndex, filter]);

    useEffect(() => {
        document
            .getElementById(`strings-table-row-${activeIndex}`)
            ?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, [activeIndex]);

    useEffect(() => {
        setQuery("");
        searchIndex.clear();
    }, [sources]);

    useHotkeys("ctrl+k", () => ref.current?.focus(), {
        enableOnFormTags: true,
        preventDefault: true,
    });

    return (
        <CollapsibleCard
            title="Strings"
            style={(expanded) => ({
                minHeight: "56px",
                flexBasis: "0",
                flexGrow: expanded ? "1" : "0",
                flexShrink: "1",
                gap: "0",
            })}
            contentStyle={() => ({
                flexGrow: "1",
                minHeight: "0",
                gap: "0",
            })}
        >
            <search className="search">
                <span className="icon">search</span>
                <input
                    ref={ref}
                    type="text"
                    placeholder="Search (Ctrl+K)"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => {
                        searchIndex.clear();
                        sources.forEach(({ key, value }, index) =>
                            searchIndex.add({
                                index: index,
                                key: key,
                                source: value,
                                translation: translations.get(key)?.value ?? "",
                            }),
                        );
                    }}
                />
            </search>
            <div className="row strings-filters">
                <button
                    className={filter === "all" ? "tonal-button" : ""}
                    aria-current={filter === "all"}
                    onClick={() => setFilter("all")}
                >
                    All ({searchResult.length})
                </button>
                <button
                    className={filter === "untranslated" ? "tonal-button" : ""}
                    aria-current={filter === "untranslated"}
                    onClick={() => setFilter("untranslated")}
                >
                    Untranslated ({untranslatedCount})
                </button>
                <button
                    className={filter === "translated" ? "tonal-button" : ""}
                    aria-current={filter === "translated"}
                    onClick={() => setFilter("translated")}
                >
                    Translated ({searchResult.length - untranslatedCount})
                </button>
            </div>
            <div
                style={{
                    minHeight: "0",
                    flexGrow: "1",
                    flexShrink: "1",
                    overflowY: "scroll",
                    margin: "0",
                    borderRadius: "0 0 16px 16px",
                }}
            >
                <table className="strings-table">
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>Key</th>
                            <th>Source</th>
                            <th>Translation</th>
                        </tr>
                    </thead>
                    <tbody>{elements}</tbody>
                </table>
            </div>
        </CollapsibleCard>
    );
}

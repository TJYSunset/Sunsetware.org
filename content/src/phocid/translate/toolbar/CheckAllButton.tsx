import { Popover, PopoverAnchor, PopoverProvider } from "@ariakit/react";
import * as React from "react";
import { ReactElement, ReactNode, useMemo, useState } from "react";
import { useShallow } from "zustand/react/shallow";
import { useFileState } from "../data/FileState.js";
import {
    CheckResult,
    checkSeverityEmoji,
    checkTranslation,
} from "../data/String.js";
import { useViewState } from "../data/ViewState.js";
import { ToolbarButton } from "./Toolbar.js";

export function CheckAllButton(): ReactElement {
    const [locale, sources, translations] = useFileState(
        useShallow((x) => [x.locale, x.sources, x.translations]),
    );
    const setActiveIndex = useViewState((x) => x.setActiveIndex);
    const [open, setOpen] = useState(false);
    const result = useMemo<ReactNode>(() => {
        if (!open) {
            return <></>;
        }
        if (!locale) {
            return <p>{checkSeverityEmoji("error")} Please select a locale</p>;
        }

        const withErrors: [string, number, CheckResult[]][] = [];
        const withWarnings: [string, number, CheckResult[]][] = [];
        const withInfos: [string, number, CheckResult[]][] = [];
        const untranslated: [string, number][] = [];

        sources.forEach((source, index) => {
            const translation = translations.get(source.key);
            if (!translation?.value) {
                untranslated.push([source.key, index]);
            } else {
                const results = checkTranslation(
                    locale,
                    source.key,
                    source.value,
                    translation.value,
                );

                if (results.some((x) => x.severity === "error")) {
                    withErrors.push([source.key, index, results]);
                } else if (results.some((x) => x.severity === "warning")) {
                    withWarnings.push([source.key, index, results]);
                } else if (results.length > 0) {
                    withInfos.push([source.key, index, results]);
                }
            }
        });

        return (
            <>
                <header>With error ({withErrors.length})</header>
                {withErrors.length > 0 && (
                    <ul>
                        {withErrors.map(([key, index, results]) => (
                            <li key={index}>
                                <a onClick={() => setActiveIndex(index)}>
                                    {key}
                                </a>
                                <br />
                                {results
                                    .map(
                                        ({ severity, message }) =>
                                            `${checkSeverityEmoji(severity)} ${message}`,
                                    )
                                    .join("\n")}
                            </li>
                        ))}
                    </ul>
                )}
                <header>With warning ({withWarnings.length})</header>
                {withWarnings.length > 0 && (
                    <ul>
                        {withWarnings.map(([key, index, results]) => (
                            <li key={index}>
                                <a onClick={() => setActiveIndex(index)}>
                                    {key}
                                </a>
                                <br />
                                {results
                                    .map(
                                        ({ severity, message }) =>
                                            `${checkSeverityEmoji(severity)} ${message}`,
                                    )
                                    .join("\n")}
                            </li>
                        ))}
                    </ul>
                )}
                <header>With info ({withInfos.length})</header>
                {withInfos.length > 0 && (
                    <ul>
                        {withInfos.map(([key, index, results]) => (
                            <li key={index}>
                                <a onClick={() => setActiveIndex(index)}>
                                    {key}
                                </a>
                                <br />
                                {results
                                    .map(
                                        ({ severity, message }) =>
                                            `${checkSeverityEmoji(severity)} ${message}`,
                                    )
                                    .join("\n")}
                            </li>
                        ))}
                    </ul>
                )}
                <header>Untranslated ({untranslated.length})</header>
                <ul>
                    {untranslated.map(([key, index]) => (
                        <li key={index}>
                            <a onClick={() => setActiveIndex(index)}>{key}</a>
                        </li>
                    ))}
                </ul>
            </>
        );
    }, [open]);

    return (
        <PopoverProvider>
            <PopoverAnchor>
                <ToolbarButton
                    content="Check all"
                    icon="checklist"
                    onClick={() => {
                        setOpen(!open);
                    }}
                />
            </PopoverAnchor>
            <Popover open={open} className="popover popover-large">
                <header>
                    <h2>Check result</h2>
                </header>

                <div className="popover-content">{result}</div>

                <button onClick={() => setOpen(false)}>OK</button>
            </Popover>
        </PopoverProvider>
    );
}

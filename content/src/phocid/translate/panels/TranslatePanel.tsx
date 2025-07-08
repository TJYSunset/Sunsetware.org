import * as React from "react";
import { ReactNode, RefObject, useEffect, useMemo } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { useShallow } from "zustand/react/shallow";
import { CollapsibleCard } from "../components/CollapsibleCard.tsx";
import { useFileState } from "../data/FileState.js";
import { checkSeverityEmoji, checkTranslation } from "../data/String.js";
import { useViewState } from "../data/ViewState.js";

export function TranslatePanel({
    translationTextAreaRef,
}: {
    translationTextAreaRef: RefObject<HTMLTextAreaElement>;
}): ReactNode {
    const [locale, sources, translations, setTranslation] = useFileState(
        useShallow((x) => [
            x.locale,
            x.sources,
            x.translations,
            x.setTranslation,
        ]),
    );
    const [activeIndex, setActiveIndex] = useViewState(
        useShallow((x) => [x.activeIndex, x.setActiveIndex]),
    );

    const [
        key,
        source,
        translation,
        check,
        previousUntranslatedIndex,
        previousIndex,
        nextIndex,
        nextUntranslatedIndex,
    ] = useMemo(() => {
        const source = sources[activeIndex];
        const key = source?.key;
        const translation = translations.get(source?.key);
        const checkResults =
            source && translation?.value
                ? checkTranslation(locale, key, source.value, translation.value)
                : [];
        const check = !source
            ? ""
            : !translation?.value
              ? "🚧 Untranslated"
              : checkResults.length > 0
                ? checkResults
                      .map(
                          ({ severity, message }) =>
                              `${checkSeverityEmoji(severity)} ${message}`,
                      )
                      .join("\n")
                : "🟢 OK";

        let previousUntranslatedIndex = null as number;
        let nextUntranslatedIndex = null as number;

        if (activeIndex < sources.length) {
            for (let i = activeIndex - 1; i >= 0; i--) {
                if (!translations.get(sources[i]?.key)?.value) {
                    previousUntranslatedIndex = i;
                    break;
                }
            }
            for (let i = activeIndex + 1; i < sources.length; i++) {
                if (!translations.get(sources[i]?.key)?.value) {
                    nextUntranslatedIndex = i;
                    break;
                }
            }
        }

        const previousIndex =
            activeIndex > 1 && activeIndex < sources.length
                ? activeIndex - 1
                : null;
        const nextIndex =
            activeIndex < sources.length - 1 ? activeIndex + 1 : null;

        return [
            key,
            source,
            translation,
            check,
            previousUntranslatedIndex,
            previousIndex,
            nextIndex,
            nextUntranslatedIndex,
        ];
    }, [locale, sources, translations, activeIndex]);

    useEffect(() => {
        if (activeIndex >= sources.length) {
            setActiveIndex(0);
        } else {
            translationTextAreaRef.current?.focus();
        }
    }, [activeIndex]);

    useHotkeys(
        "ctrl+enter",
        () => {
            setActiveIndex(nextUntranslatedIndex ?? activeIndex);
        },
        {
            enableOnFormTags: true,
            preventDefault: true,
        },
    );

    return (
        <CollapsibleCard
            title="Translate"
            style={(expanded) => ({
                minHeight: "56px",
                flexBasis: "0",
                flexGrow: expanded ? "1" : "0",
                flexShrink: "1",
            })}
            contentStyle={() => ({
                flexGrow: "1",
                overflowY: "auto",
            })}
        >
            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 3fr",
                    gap: "16px",
                }}
            >
                <h3>#</h3>
                <div>
                    <MinHeight height="1.5em">
                        {source?.key ? activeIndex : ""}
                    </MinHeight>
                </div>

                <h3>Key</h3>
                <div>
                    <MinHeight height="3em">{source?.key ?? ""}</MinHeight>
                </div>

                <h3>Source</h3>
                <div>
                    <MinHeight height="6em">{source?.value ?? ""}</MinHeight>
                </div>

                <h3>Source comment</h3>
                <div>
                    <MinHeight height="3em">{source?.comment ?? ""}</MinHeight>
                </div>

                <h3>Translation</h3>
                <div>
                    <textarea
                        ref={translationTextAreaRef}
                        lang={locale}
                        autoCapitalize="off"
                        value={translation?.value ?? ""}
                        onChange={(e) =>
                            setTranslation({
                                key: key,
                                value: e.target.value,
                                comment: translation?.comment ?? "",
                            })
                        }
                    />
                </div>

                <div />
                <div />

                <h3>Translation comment</h3>
                <div>
                    <textarea
                        autoCapitalize="off"
                        placeholder="Optional comment for yourself or other translators. Comment won't be saved if translation is empty!"
                        value={translation?.comment ?? ""}
                        onChange={(e) =>
                            setTranslation({
                                key: key,
                                value: translation?.value ?? "",
                                comment: e.target.value,
                            })
                        }
                    />
                </div>

                <h3>Syntax check</h3>
                <div>
                    <MinHeight height="3em">{check}</MinHeight>
                </div>
            </div>

            <div />
            <div style={{ flexGrow: "1" }} />

            <div className="row" style={{ justifyContent: "flex-end" }}>
                <button
                    disabled={previousUntranslatedIndex === null}
                    onClick={() =>
                        setActiveIndex(previousUntranslatedIndex ?? activeIndex)
                    }
                >
                    Previous untranslated
                </button>
                <button
                    disabled={previousIndex === null}
                    onClick={() => setActiveIndex(previousIndex ?? activeIndex)}
                >
                    Previous
                </button>
                <button
                    disabled={nextIndex === null}
                    onClick={() => setActiveIndex(nextIndex ?? activeIndex)}
                >
                    Next
                </button>
                <button
                    disabled={nextUntranslatedIndex === null}
                    onClick={() =>
                        setActiveIndex(nextUntranslatedIndex ?? activeIndex)
                    }
                >
                    Next untranslated (Ctrl+Enter)
                </button>
            </div>
        </CollapsibleCard>
    );
}

function MinHeight({
    height,
    children,
}: {
    height: string;
    children: ReactNode;
}): ReactNode {
    return <div style={{ minHeight: height }}>{children}</div>;
}

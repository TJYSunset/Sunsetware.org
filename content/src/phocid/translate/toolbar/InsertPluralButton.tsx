import { Popover, PopoverAnchor, PopoverProvider } from "@ariakit/react";
import * as React from "react";
import { ReactNode, RefObject, useEffect, useRef, useState } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { useShallow } from "zustand/react/shallow";
import { HelpTooltip } from "../components/HelpTooltip.js";
import { pluralRulesMap } from "../data/Cldr.js";
import { useFileState } from "../data/FileState.js";
import { checkSeverityEmoji } from "../data/String.js";
import { useTransientViewState } from "../data/TransientViewState.js";
import { useViewState } from "../data/ViewState.js";
import { ToolbarButton } from "./Toolbar.js";

export function InsertPluralButton({
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
    const activeIndex = useViewState((x) => x.activeIndex);
    const [insertPluralOpen, setInsertPluralOpen] = useTransientViewState(
        useShallow((x) => [x.insertPluralOpen, x.setInsertPluralOpen]),
    );
    const [argument, setArgument] = useState("0");
    const [cases, setCases] = useState(new Map<string, string>());

    const ref = useRef<HTMLDivElement>(null);

    const rules = pluralRulesMap.get(locale)?.rules;

    useEffect(() => {
        setArgument("0");
        setCases(new Map());
    }, [locale, insertPluralOpen]);

    useEffect(() => {
        if (insertPluralOpen) {
            ref.current?.getElementsByTagName("input")?.[0]?.focus();
        }
    }, [insertPluralOpen]);

    function insertAndClose(): void {
        const key = sources[activeIndex]?.key;
        if (!key || !translationTextAreaRef.current) return;

        const translation = translations.get(key) ?? {
            key: key,
            value: "",
            comment: "",
        };
        const caret = translationTextAreaRef.current.selectionStart;
        setTranslation({
            key: key,
            value:
                translation.value.substring(0, caret) +
                `{${argument}, plural, ${[...cases].map(([c, value]) => `${c} {${value}}`).join(" ")}}` +
                translation.value.substring(caret),
            comment: translation.comment,
        });
        translationTextAreaRef.current.focus();
        setInsertPluralOpen(false);
    }

    useHotkeys("ctrl+p", () => setInsertPluralOpen(true), {
        enableOnFormTags: true,
        preventDefault: true,
    });

    useHotkeys(
        "shift+enter",
        () => {
            if (insertPluralOpen) {
                insertAndClose();
            }
        },
        {
            enableOnFormTags: true,
            preventDefault: true,
        },
    );

    return (
        <PopoverProvider>
            <PopoverAnchor>
                <ToolbarButton
                    content="Insert plural (Ctrl+P)"
                    icon="add"
                    onClick={() => {
                        setInsertPluralOpen(!insertPluralOpen);
                    }}
                />
            </PopoverAnchor>
            <Popover
                ref={ref}
                open={insertPluralOpen}
                className="popover popover-large"
                style={{ width: "400px" }}
            >
                <header>
                    <h2>Insert plural</h2>
                </header>

                {!rules ? (
                    <>{checkSeverityEmoji("error")} Please select a locale</>
                ) : (
                    <>
                        <header>Argument name</header>
                        <input
                            value={argument}
                            onChange={(e) => setArgument(e.target.value)}
                        />
                        {rules.map(({ count, rule, samples }) => (
                            <div key={count} className="column">
                                <header className="row">
                                    {count === "other"
                                        ? `${count} (required)`
                                        : count}
                                    <HelpTooltip tabindex={-1}>
                                        {samples.length > 0 && (
                                            <p>
                                                Examples: {samples.join("; ")}
                                            </p>
                                        )}
                                        {rule && <p>Rule: {rule}</p>}
                                        <p>
                                            <a
                                                href={`https://www.unicode.org/cldr/charts/46/supplemental/language_plural_rules.html#${locale.replaceAll("-", "_")}`}
                                                target="_blank"
                                            >
                                                More examples
                                            </a>
                                            <br />
                                            <a
                                                href="https://unicode.org/reports/tr35/tr35-numbers.html#Operands"
                                                target="_blank"
                                            >
                                                What do the strange letters
                                                mean?
                                            </a>
                                        </p>
                                    </HelpTooltip>
                                </header>
                                <input
                                    placeholder={
                                        count === "other"
                                            ? ""
                                            : 'Leave blank to fallback to "other"'
                                    }
                                    value={cases.get(count) ?? ""}
                                    onChange={(e) => {
                                        const map = new Map(cases);
                                        map.set(count, e.target.value);
                                        setCases(map);
                                    }}
                                />
                            </div>
                        ))}

                        {rules.length === 1 && (
                            <p>
                                ℹ️ You can use "{`{${argument || "0"}}`}" as a
                                replacement of "
                                {`{${argument || "0"}, plural, other {#}}`}"
                                since this locale has only one plural category.
                            </p>
                        )}
                    </>
                )}

                <div className="row buttons">
                    <button
                        onClick={() => {
                            setInsertPluralOpen(false);
                        }}
                    >
                        Cancel
                    </button>
                    <button onClick={insertAndClose}>
                        Insert (Shift+Enter)
                    </button>
                </div>
            </Popover>
        </PopoverProvider>
    );
}

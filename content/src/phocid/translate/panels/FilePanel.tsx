import {
    Combobox,
    ComboboxItem,
    ComboboxList,
    ComboboxProvider,
    Popover,
    PopoverAnchor,
    PopoverProvider,
    Select,
    SelectItem,
    SelectPopover,
    SelectProvider,
} from "@ariakit/react";
import { Index } from "flexsearch";
import * as React from "react";
import {
    memo,
    ReactNode,
    startTransition,
    useMemo,
    useRef,
    useState,
} from "react";
import { useShallow } from "zustand/react/shallow";
import { CollapsibleCard } from "../components/CollapsibleCard.tsx";
import { HelpTooltip } from "../components/HelpTooltip.tsx";
import { PluralRules, pluralRulesMap } from "../data/Cldr.ts";
import { getDirectoryName, useFileState } from "../data/FileState.js";

function displayName(rules: PluralRules): string {
    if (rules) {
        return `${rules.localeCode} - ${rules.localeName}`;
    } else {
        return "Select";
    }
}

const localeIndex = new Index({ tokenize: "forward" });
pluralRulesMap.forEach((x) => {
    localeIndex.add(x.localeCode, displayName(x));
});

export function FilePanel(): ReactNode {
    const [
        variant,
        directoryName,
        setVariant,
        setSourcesXml,
        setTranslationsXml,
    ] = useFileState(
        useShallow((x) => [
            x.variant,
            getDirectoryName(x),
            x.setVariant,
            x.setSourcesXml,
            x.setTranslationsXml,
        ]),
    );

    return (
        <CollapsibleCard title="File">
            <div className="row">
                <h3>Locale</h3>
            </div>
            <LocaleSelect />

            <div />

            <div className="row">
                <h3>Variant</h3>
                <HelpTooltip>
                    <p>
                        Additional language tag contents to the tag selected in
                        "Locale", replacing "-"/"_" with "+", excluding the
                        initial separator. Leave blank when in doubt. See{" "}
                        <a
                            href="https://en.wikipedia.org/wiki/IETF_language_tag"
                            target="_blank"
                        >
                            Wikipedia on "IETF language tag"
                        </a>{" "}
                        and{" "}
                        <a
                            href="https://developer.android.com/training/basics/supporting-devices/languages"
                            target="_blank"
                        >
                            the relevant Android docs
                        </a>
                        .
                    </p>
                    <p>
                        Unlike the "Locale" field above, this value does not
                        affect syntax checks. Please select your full locale if
                        it exists in the "Locale" selector instead of adding the
                        suffix here.
                    </p>
                </HelpTooltip>
            </div>
            <input
                type="text"
                placeholder="None"
                value={variant}
                onChange={(e) => {
                    const start = e.target.selectionStart;
                    const end = e.target.selectionEnd;
                    window.requestAnimationFrame(() => {
                        e.target.selectionStart = start;
                        e.target.selectionEnd = end;
                    });
                    setVariant(e.target.value);
                }}
            />

            <div />

            <h3>Directory name</h3>
            <div style={{ padding: "0 12px" }}>
                {directoryName ?? "Invalid"}
            </div>

            <div />

            <h3>Source strings</h3>
            <div className="row">
                <DownloadFromGitHubButton directoryName="values" />
                <OpenFileButton onOpen={(xml) => setSourcesXml(xml)} />
            </div>

            <div />

            <h3>Translations</h3>
            <div className="row">
                <DownloadFromGitHubButton directoryName={directoryName} />
                <OpenFileButton onOpen={(xml) => setTranslationsXml(xml)} />
            </div>
        </CollapsibleCard>
    );
}

const LocaleSelect = memo(() => {
    const locale = useFileState((x) => x.locale);
    const setLocale = useFileState((x) => x.setLocale);
    const [query, setQuery] = useState("");
    const matches = useMemo(() => {
        if (query) {
            return localeIndex
                .search(query)
                .map((x) => pluralRulesMap.get(x as string));
        } else {
            return [...pluralRulesMap.values()];
        }
    }, [query]);

    return (
        <ComboboxProvider
            resetValueOnHide
            setValue={(value) => {
                startTransition(() => {
                    setQuery(value);
                });
            }}
        >
            <SelectProvider value={locale} setValue={setLocale}>
                <Select className="select">
                    <span>{displayName(pluralRulesMap.get(locale))}</span>
                    <span className="icon">arrow_drop_down</span>
                </Select>
                <SelectPopover gutter={4} sameWidth className="select-popover">
                    <search className="search">
                        <span className="icon">search</span>
                        <Combobox
                            autoSelect
                            placeholder="Search"
                            className="combobox"
                        />
                    </search>
                    <ComboboxList>
                        {matches.map((value) => (
                            <SelectItem
                                key={value.localeCode}
                                value={value.localeCode}
                                className="select-item"
                                render={<ComboboxItem />}
                            >
                                {displayName(value)}
                            </SelectItem>
                        ))}
                    </ComboboxList>
                </SelectPopover>
            </SelectProvider>
        </ComboboxProvider>
    );
});

function DownloadFromGitHubButton({
    directoryName,
}: {
    directoryName: string;
}): ReactNode {
    return (
        <button
            onClick={() =>
                window.open(
                    `https://raw.githubusercontent.com/TJYSunset/Phocid/refs/heads/main/app/src/main/res/${directoryName}/strings.xml`,
                )
            }
        >
            Download current from GitHub
        </button>
    );
}

function OpenFileButton({
    onOpen,
}: {
    onOpen: (_: string) => Error;
}): ReactNode {
    const ref = useRef<HTMLInputElement>(null);
    const [error, setError] = useState<Error>(null);

    return (
        <PopoverProvider>
            <PopoverAnchor>
                <input
                    ref={ref}
                    type="file"
                    accept="application/xml"
                    style={{ display: "none" }}
                    onChange={async (e) => {
                        setError(onOpen(await e.target.files[0].text()));
                    }}
                />
                <button
                    onClick={() => {
                        ref.current?.click();
                    }}
                >
                    Open local file
                </button>
            </PopoverAnchor>
            <Popover open={error} className="popover">
                <header>Invalid file</header>
                <p>{error?.toString()}</p>
                <button onClick={() => setError(null)}>OK</button>
            </Popover>
        </PopoverProvider>
    );
}

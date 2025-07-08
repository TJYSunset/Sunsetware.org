import { Popover, PopoverAnchor, PopoverProvider } from "@ariakit/react";
import * as React from "react";
import { ReactNode, useEffect, useState } from "react";
import { useShallow } from "zustand/react/shallow";
import { checkSeverityEmoji } from "../data/String.js";
import { useViewState } from "../data/ViewState.js";
import { ToolbarButton } from "./Toolbar.js";

export function HelpButton(): ReactNode {
    const [firstRun, unsetFirstRun] = useViewState(
        useShallow((x) => [x.firstRun, x.unsetFirstRun]),
    );
    const [open, setOpen] = useState(false);
    useEffect(() => {
        if (firstRun) {
            setOpen(true);
            unsetFirstRun();
        }
    }, [firstRun]);

    return (
        <PopoverProvider>
            <PopoverAnchor>
                <ToolbarButton
                    content="Help"
                    icon="help"
                    onClick={() => {
                        setOpen(!open);
                    }}
                />
            </PopoverAnchor>
            <Popover open={open} className="popover popover-large">
                <header>
                    <h2>Help</h2>
                </header>

                <p>
                    A moderate computer, a latest browser and a wide screen
                    monitor are required.{" "}
                    <a
                        href="https://www.mozilla.org/en-US/firefox/all/"
                        target="_blank"
                    >
                        Firefox
                    </a>{" "}
                    is recommended as it's the primary browser used for testing.
                </p>

                <p>
                    This editor is experimental and likely buggy. Please save
                    often to avoid data loss.{" "}
                    <a href="https://github.com/TJYSunset/Phocid/discussions">
                        Report bugs here
                    </a>{" "}
                    if you've encountered any.
                </p>

                <p>
                    If this editor is somehow irreversibly broken, try clearing
                    website data for this site only (specifically, its "local
                    storage").
                </p>

                <p>
                    Editor state might be preserved after browser closes, but
                    please always save to file instead of relying on browser
                    persistence.
                </p>

                <p>
                    Computations happen inside your browser; therefore, lags are
                    expected.
                </p>

                <h3>Instructions</h3>

                <ol>
                    <li>Select your locale and variant in the "File" panel.</li>
                    <li>
                        Click "Download current from GitHub", save (Ctrl+S) the
                        opened page to a file, then open it with "Open local
                        file". Also open the translations in the same way if
                        you're working on an existing locale.
                    </li>
                    <li>
                        If you don't understand the context of a string, you can
                        try to infer it from its key and strings with a similar
                        key; If this isn't helping, please{" "}
                        <a href="https://github.com/TJYSunset/Phocid/discussions">
                            ask on GitHub
                        </a>
                        .
                    </li>
                    <li>
                        Ensure there aren't any errors (
                        {checkSeverityEmoji("error")}) using "Check all". You
                        can safely ignore non-error reports if they're are
                        intentional.
                    </li>
                    <li>
                        After you've finished, click "Save to file". Create a{" "}
                        <a href="https://github.com/TJYSunset/Phocid/pulls">
                            pull request
                        </a>{" "}
                        if you understand Git; otherwise{" "}
                        <a href="https://en.wikipedia.org/wiki/ZIP_(file_format)">
                            zip
                        </a>{" "}
                        the file, then create an{" "}
                        <a href="https://github.com/TJYSunset/Phocid/issues">
                            issue
                        </a>{" "}
                        with the zip directly attached.
                    </li>
                </ol>

                <h3>External links</h3>

                <ul>
                    <li>
                        <a
                            href="https://unicode-org.github.io/icu/userguide/format_parse/messages/"
                            target="_blank"
                        >
                            ICU MessageFormat
                        </a>
                    </li>
                    <li>
                        <a
                            href="https://icu4j-demos.unicode.org/icu4jweb/formatTest.jsp"
                            target="_blank"
                        >
                            Online tester for ICU MessageFormat
                        </a>
                    </li>
                    <li>
                        <a
                            href="https://www.unicode.org/cldr/charts/46/supplemental/language_plural_rules.html"
                            target="_blank"
                        >
                            Plural rules
                        </a>
                    </li>
                    <li>
                        <a
                            href="https://github.com/TJYSunset/Sunsetware.org"
                            target="_blank"
                        >
                            Editor source code
                        </a>
                    </li>
                </ul>

                <button onClick={() => setOpen(false)}>OK</button>
            </Popover>
        </PopoverProvider>
    );
}

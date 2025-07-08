import * as React from "react";
import { ReactNode, StrictMode, useEffect, useRef } from "react";
import { createRoot } from "react-dom/client";
import { useViewState } from "./data/ViewState.js";
import "./main.scss";
import { FilePanel } from "./panels/FilePanel.tsx";
import { StringsPanel } from "./panels/StringsPanel.tsx";
import { TranslatePanel } from "./panels/TranslatePanel.tsx";
import { Toolbar } from "./toolbar/Toolbar.tsx";

const container = document.getElementById("app");
const root = createRoot(container);
root.render(<Main />);

function Main(): ReactNode {
    const darkTheme = useViewState((x) => x.darkTheme);

    const translationTextAreaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        document.documentElement.classList.toggle("light-theme", !darkTheme);
    }, [darkTheme]);

    return (
        <StrictMode>
            <div
                style={{
                    display: "grid",
                    gridTemplateRows: "auto 1fr",
                    gridTemplateColumns: "1fr",
                    gap: "16px",
                    width: "100%",
                    height: "100%",
                }}
            >
                <Toolbar
                    translationTextAreaRef={translationTextAreaRef}
                    style={{ gridArea: "1 / 1" }}
                />
                <div
                    style={{
                        gridArea: "2 / 1",
                        display: "grid",
                        gridTemplateRows: "1fr",
                        gridTemplateColumns: "1fr 1fr",
                        gap: "16px",
                    }}
                >
                    <div
                        style={{
                            gridArea: "1 / 1",
                            display: "flex",
                            flexDirection: "column",
                            gap: "16px",
                            minHeight: "0",
                        }}
                    >
                        <FilePanel />
                        <StringsPanel />
                    </div>
                    <div
                        style={{
                            gridArea: "1 / 2",
                            display: "flex",
                            flexDirection: "column",
                            gap: "16px",
                            minHeight: "0",
                        }}
                    >
                        <TranslatePanel
                            translationTextAreaRef={translationTextAreaRef}
                        />
                    </div>
                </div>
            </div>
        </StrictMode>
    );
}

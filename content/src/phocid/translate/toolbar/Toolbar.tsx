import * as React from "react";
import { CSSProperties, ReactNode, RefObject } from "react";
import { useViewState } from "../data/ViewState.js";
import { CheckAllButton } from "./CheckAllButton.js";
import { HelpButton } from "./HelpButton.js";
import { InsertPluralButton } from "./InsertPluralButton.js";
import { SaveToFileButton } from "./SaveToFileButton.js";

export function Toolbar({
    translationTextAreaRef,
    style,
}: {
    translationTextAreaRef: RefObject<HTMLTextAreaElement>;
    style?: CSSProperties;
}): ReactNode {
    const darkTheme = useViewState((state) => state.darkTheme);
    const switchTheme = useViewState((state) => state.switchTheme);

    return (
        <div className="toolbar" style={style}>
            <SaveToFileButton />
            <InsertPluralButton
                translationTextAreaRef={translationTextAreaRef}
            />
            <CheckAllButton />
            <HelpButton />
            <div style={{ flexGrow: "1" }} />
            <ToolbarButton
                content="Switch theme"
                icon={darkTheme ? "dark_mode" : "light_mode"}
                onClick={switchTheme}
            />
        </div>
    );
}

export function ToolbarButton({
    content,
    icon,
    onClick,
}: {
    content: string;
    icon: string;
    onClick: () => void;
}): ReactNode {
    return (
        <button className="toolbar-buttton" onClick={onClick}>
            <span className="icon">{icon}</span>
            {content}
        </button>
    );
}

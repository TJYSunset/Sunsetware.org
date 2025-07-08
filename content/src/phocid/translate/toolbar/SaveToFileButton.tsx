import * as React from "react";
import { ReactNode, useRef } from "react";
import { useShallow } from "zustand/react/shallow";
import { useFileState } from "../data/FileState.js";
import { encodeStringsXml } from "../data/String.js";
import { ToolbarButton } from "./Toolbar.js";

export function SaveToFileButton(): ReactNode {
    const [sources, translations] = useFileState(
        useShallow((x) => [x.sources, x.translations]),
    );

    const ref = useRef<HTMLAnchorElement>(null);

    return (
        <>
            <a hidden={true} ref={ref} download="strings.xml" />
            <ToolbarButton
                content="Save to file"
                icon="download"
                onClick={() => {
                    const xml = encodeStringsXml(
                        sources
                            .map((x) => translations.get(x.key))
                            .filter((x) => x?.value),
                    );
                    ref.current?.setAttribute(
                        "href",
                        `data:application/octet-stream;charset=utf8,${encodeURIComponent(xml)}`,
                    );
                    ref.current?.click();
                }}
            />
        </>
    );
}

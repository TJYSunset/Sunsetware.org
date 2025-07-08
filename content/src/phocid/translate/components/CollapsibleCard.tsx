import {
    Disclosure,
    DisclosureContent,
    DisclosureProvider,
} from "@ariakit/react";
import * as React from "react";
import { CSSProperties, ReactNode, useState } from "react";

export function CollapsibleCard({
    title,
    children,
    style,
    contentStyle,
}: {
    title: string;
    children: ReactNode;
    style?: (expanded: boolean) => CSSProperties;
    contentStyle?: (expanded: boolean) => CSSProperties;
}): ReactNode {
    const [open, setOpen] = useState(true);

    return (
        <article
            className={open ? "card card-expanded" : "card"}
            style={style?.(open) ?? {}}
        >
            <DisclosureProvider open={open} setOpen={setOpen}>
                <Disclosure className="card-header">
                    <span className="icon">
                        {open ? "arrow_drop_down" : "arrow_right"}
                    </span>
                    <h2>{title}</h2>
                </Disclosure>
                <DisclosureContent
                    className="card-content"
                    style={contentStyle?.(open) ?? {}}
                >
                    {children}
                </DisclosureContent>
            </DisclosureProvider>
        </article>
    );
}

import * as React from "react";
import { ReactNode, RefObject } from "react";

export function Dialog({
    ref,
    title,
    children,
}: {
    ref: RefObject;
    title: string;
    children: ReactNode;
}): ReactNode {
    return (
        <dialog ref={ref}>
            <header>{title}</header>
            {children}
            <footer></footer>
        </dialog>
    );
}

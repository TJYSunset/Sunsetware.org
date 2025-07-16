import { Tooltip, TooltipAnchor, TooltipProvider } from "@ariakit/react";
import * as React from "react";
import { ReactNode } from "react";

export function HelpTooltip({
    children,
    tabindex,
}: {
    children: ReactNode;
    tabindex?: number;
}): ReactNode {
    return (
        <TooltipProvider>
            <TooltipAnchor
                style={{ display: "inline-block" }}
                tabIndex={tabindex}
            >
                <div className="icon">help</div>
            </TooltipAnchor>
            <Tooltip className="tooltip-popover">{children}</Tooltip>
        </TooltipProvider>
    );
}

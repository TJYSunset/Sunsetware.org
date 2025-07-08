import { create } from "zustand";
import { devtools } from "zustand/middleware";

export interface TransientViewState {
    insertPluralOpen: boolean;

    setInsertPluralOpen: (value: boolean) => void;
}

export const useTransientViewState = create<TransientViewState>()(
    devtools(
        (set): TransientViewState => ({
            insertPluralOpen: false,

            setInsertPluralOpen: (value) => {
                set({ insertPluralOpen: value });
            },
        }),
    ),
);

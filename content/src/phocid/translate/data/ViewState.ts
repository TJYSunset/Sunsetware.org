import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import { zustandStorage } from "../Utils.js"; // required for devtools typing

export interface ViewState {
    darkTheme: boolean;
    activeIndex: number;
    firstRun: boolean;

    switchTheme: () => void;
    setActiveIndex: (value: number) => void;
    unsetFirstRun: () => void;
}

export const useViewState = create<ViewState>()(
    devtools(
        persist(
            (set) => ({
                darkTheme: true,
                activeIndex: 0,
                firstRun: true,

                switchTheme: () =>
                    set((state) => ({ darkTheme: !state.darkTheme })),
                setActiveIndex: (value) => set({ activeIndex: value }),
                unsetFirstRun: () => {
                    set({ firstRun: false });
                },
            }),
            {
                name: "ViewState",
                storage: zustandStorage,
            },
        ),
    ),
);

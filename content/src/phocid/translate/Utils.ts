import SuperJSON from "superjson";
import { PersistStorage } from "zustand/middleware/persist";

export const zustandStorage: PersistStorage<unknown> = {
    getItem: (name) => {
        const str = localStorage.getItem(name);
        if (!str) return null;
        return SuperJSON.parse(str);
    },
    setItem: (name, value) => {
        localStorage.setItem(name, SuperJSON.stringify(value));
    },
    removeItem: (name) => localStorage.removeItem(name),
};

export function toError(object: object): Error {
    if (object instanceof Error) {
        return object;
    } else {
        return new Error(object.toString());
    }
}

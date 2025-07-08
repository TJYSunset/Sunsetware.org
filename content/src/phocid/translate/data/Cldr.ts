import pluralsData from "./plurals.generated.json";

export interface PluralRules {
    localeCode: string;
    localeName: string;
    rules: {
        count: string;
        rule: string;
        samples: string[];
    }[];
}

export const pluralRulesMap = new Map(
    pluralsData.map((x) => [x.localeCode, x as PluralRules]),
);

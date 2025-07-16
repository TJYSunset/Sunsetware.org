import * as messageformat from "@messageformat/parser";
import { PluralCategory } from "@messageformat/parser";
import { XMLBuilder, XMLParser } from "fast-xml-parser";
import { pluralRulesMap } from "./Cldr.js";
import { StringEntry } from "./FileState.js";

interface XmlNode {
    ":@":
        | {
              "@_name": string | undefined;
              "@_translatable": string | undefined;
          }
        | undefined;
    string: { "#text": string }[] | undefined;
    comment: { "#text": string }[] | undefined;
}

export function parseStringEntries(xml: string): StringEntry[] {
    const parser = new XMLParser({
        preserveOrder: true,
        ignoreAttributes: false,
        attributeNamePrefix: "@_",
        commentPropName: "comment",
    });
    const strings = parser.parse(xml) as { resources: XmlNode[] | undefined }[];
    let comment = "";
    const entries = [] as StringEntry[];
    (
        strings.find((x) => x.resources !== undefined).resources as XmlNode[]
    ).forEach((node) => {
        if (node.comment !== undefined) {
            comment = node.comment[0]["#text"];
        } else if (
            node.string !== undefined &&
            node[":@"]["@_translatable"] !== "false"
        ) {
            entries.push({
                key: node[":@"]["@_name"],
                value: unescapeAndroid(node.string[0]["#text"]),
                comment: comment.trim(),
            });
            comment = "";
        }
    });
    return entries.filter(
        (x) =>
            x.key !== undefined &&
            x.value !== undefined &&
            x.comment !== undefined,
    );
}

export function encodeStringsXml(strings: StringEntry[]): string {
    const declarationNode = {
        "?xml": [
            {
                "#text": "",
            },
        ],
        ":@": {
            "@_version": "1.0",
            "@_encoding": "UTF-8",
            "@_standalone": "no",
        },
    };
    const stringNodes = strings
        .flatMap((x) => [
            x.comment
                ? {
                      comment: [
                          {
                              "#text": ` ${x.comment.trim()} `,
                          },
                      ],
                  }
                : undefined,
            {
                string: [
                    {
                        "#text": escapeAndroid(x.value),
                    },
                ],
                ":@": {
                    "@_name": x.key,
                },
            },
        ])
        .filter((x) => x);
    // noinspection HttpUrlsUsage
    const resourcesNode = {
        resources: stringNodes,
        ":@": {
            "@_xmlns:tools": "http://schemas.android.com/tools",
        },
    };
    const builder = new XMLBuilder({
        format: true,
        indentBy: "    ",

        preserveOrder: true,
        ignoreAttributes: false,
        attributeNamePrefix: "@_",
        commentPropName: "comment",
    });
    return builder
        .build([declarationNode, resourcesNode])
        .replaceAll("&quot;", '"');
}

/** https://developer.android.com/guide/topics/resources/string-resource#escaping_quotes */
export function unescapeAndroid(string: string): string {
    let result = "";
    let backslash = false;
    const quoted = string.startsWith('"') && string.endsWith('"');
    if (!quoted) {
        string = string.replaceAll(/\s+/g, " ").trim();
    } else {
        string = string.replaceAll(/^"|"$/g, "");
    }

    [...string].forEach((char, index) => {
        if (char === "\\") {
            if (backslash) {
                result += "\\";
                backslash = false;
            } else {
                backslash = true;
            }
        } else {
            if (backslash) {
                if (char === "@") {
                    result += index === 1 ? "@" : "\\@";
                } else if (char === "?") {
                    result += index === 1 ? "?" : "\\?";
                } else if (char === "n") {
                    result += "\n";
                } else if (char === "t") {
                    result += "\t";
                } else if (char === "u") {
                    // Intentionally unsupported, even Android Studio doesn't
                    result += "\\u";
                } else if (char === "'") {
                    result += "'";
                } else if (char === '"') {
                    result += '"';
                } else {
                    result += `\\${char}`;
                }
                backslash = false;
            } else {
                if (char !== '"') {
                    result += char;
                }
            }
        }
    });
    if (backslash) result += "\\";

    return result;
}

export function escapeAndroid(string: string): string {
    const quoted =
        string.replaceAll(/[\r\n\t]/g, "").match(/\s\s|^\s|\s$/) !== null;
    string = string
        .replaceAll(/(^@|^\?|"|\\)/g, "\\$1")
    if (!quoted) {
        string = string.replaceAll("'", "\\'");
    }
    string = string
        .replaceAll(/\r\n|\r|\n/g, "\\n")
        .replaceAll("\t", "\\t");
    return quoted ? `"${string}"` : string;
}

export type CheckSeverity = "error" | "warning" | "info";

export interface CheckResult {
    severity: CheckSeverity;
    message: string;
}

function checkSeverityScore(severity: CheckSeverity): number {
    return severity === "error" ? 3 : severity === "warning" ? 2 : 1;
}

export function checkSeverityEmoji(severity: CheckSeverity): string {
    return severity === "error" ? "🚫" : severity === "warning" ? "⚠️" : "ℹ️";
}

export function checkTranslation(
    locale: string,
    key: string,
    source: string,
    translation: string,
): CheckResult[] {
    const results: CheckResult[] = [];
    if (source.match(/^\s+$/) === null && translation.match(/^\s+$/) !== null) {
        results.push({
            severity: "error",
            message: "Translation only has whitespaces",
        });
    } else {
        const sourceStartWhitespaces = source.match(/^\s+/)?.[0]?.length ?? 0;
        const translationStartWhitespaces =
            translation.match(/^\s+/)?.[0]?.length ?? 0;
        const sourceEndWhitespaces = source.match(/\s+$/)?.[0]?.length ?? 0;
        const translationEndWhitespaces =
            translation.match(/\s+$/)?.[0]?.length ?? 0;
        if (sourceStartWhitespaces < translationStartWhitespaces) {
            results.push({
                severity: "warning",
                message: "Extra whitespaces at start of translation",
            });
        } else if (sourceStartWhitespaces > translationStartWhitespaces) {
            results.push({
                severity: "info",
                message: "Missing whitespaces at start of translation",
            });
        }
        if (sourceEndWhitespaces < translationEndWhitespaces) {
            results.push({
                severity: "warning",
                message: "Extra whitespaces at end of translation",
            });
        } else if (sourceEndWhitespaces > translationEndWhitespaces) {
            results.push({
                severity: "info",
                message: "Missing whitespaces at end of translation",
            });
        }
        if (
            source.match(/[^\S\r\n]{2,}/) === null &&
            translation.match(/[^\S\r\n]{2,}/) !== null
        ) {
            results.push({
                severity: "error",
                message: "Translation has consecutive whitespaces",
            });
        }
    }

    if (
        source.match(/[\r\n]/) === null &&
        translation.match(/[\r\n]/) !== null
    ) {
        results.push({
            severity: "error",
            message: "Translation has unexpected line breaks",
        });
    }

    if (translation.match(/['"]/) !== null) {
        results.push({
            severity: "warning",
            message: "Consider using curly quotes (‘’“”) and apostrophes (’)",
        });
    }

    if (source === translation) {
        results.push({
            severity: "info",
            message: "Source and translation are identical",
        });
    }

    // MessageFormat
    if (source.includes("{")) {
        const pluralRules = pluralRulesMap.get(locale);
        if (!pluralRules) {
            results.push({
                severity: "error",
                message: "Please select a locale",
            });
        } else {
            let sourceArgs = null as Map<
                string,
                (
                    | messageformat.PlainArg
                    | messageformat.FunctionArg
                    | messageformat.Select
                )[]
            >;
            try {
                sourceArgs = Map.groupBy(
                    messageformat
                        .parse(source)
                        .filter((x) => x.type !== "content"),
                    (x) => x.arg,
                );
            } catch {
                //
            }
            if ((sourceArgs?.size ?? -1) > 0) {
                let translationArgs = null as Map<
                    string,
                    (
                        | messageformat.PlainArg
                        | messageformat.FunctionArg
                        | messageformat.Select
                    )[]
                >;
                try {
                    translationArgs = Map.groupBy(
                        messageformat
                            .parse(translation, {
                                cardinal: pluralRules.rules.map(
                                    (x) => x.count as PluralCategory,
                                ),
                            })
                            .filter((x) => x.type !== "content"),
                        (x) => x.arg,
                    );
                } catch (ex) {
                    results.push({
                        severity: "error",
                        message: ex.toString(),
                    });
                }
                if (translationArgs) {
                    const allowPlainAsPlural = pluralRules.rules.length === 1;
                    sourceArgs.forEach((sourceInstances, key) => {
                        const translationInstances =
                            translationArgs.get(key) ?? [];
                        if (translationInstances.length === 0) {
                            results.push({
                                severity: "error",
                                message: `Missing argument {${key}}`,
                            });
                        } else {
                            if (
                                translationInstances.some(
                                    (x) =>
                                        !(
                                            x.type ===
                                                sourceInstances[0].type ||
                                            (allowPlainAsPlural &&
                                                x.type === "argument" &&
                                                sourceInstances[0].type ===
                                                    "plural")
                                        ) ||
                                        (x.type === "function" &&
                                            sourceInstances[0].type ===
                                                "function" &&
                                            x.key !== sourceInstances[0].key),
                                )
                            ) {
                                results.push({
                                    severity: "error",
                                    message: `Argument {${key}} is of incorrect type`,
                                });
                            }
                            if (
                                sourceInstances.some(
                                    (x) => x.type === "plural",
                                ) &&
                                translationInstances.every(
                                    (x) => x.type === "plural",
                                )
                            ) {
                                const sourceHasNumber = sourceInstances
                                    .filter((x) => x.type === "plural")
                                    .every((instance: messageformat.Select) =>
                                        instance.cases.every((x) =>
                                            x.tokens.some(
                                                (y) => y.type === "octothorpe",
                                            ),
                                        ),
                                    );
                                const translationHasNumber = (
                                    translationInstances as messageformat.Select[]
                                ).every((instance) =>
                                    instance.cases.every((x) =>
                                        x.tokens.some(
                                            (y) => y.type === "octothorpe",
                                        ),
                                    ),
                                );

                                if (
                                    translationInstances.some(
                                        (x) =>
                                            x.type === "plural" &&
                                            !x.cases.some(
                                                (y) => y.key === "other",
                                            ),
                                    )
                                ) {
                                    results.push({
                                        severity: "error",
                                        message: `Plural argument {${key}} is missing the "other" case`,
                                    });
                                }
                                if (sourceHasNumber && !translationHasNumber) {
                                    results.push({
                                        severity: "warning",
                                        message: `Plural argument {${key}} might be missing the number ("#")`,
                                    });
                                }
                                if (!sourceHasNumber && translationHasNumber) {
                                    results.push({
                                        severity: "error",
                                        message: `Plural argument {${key}} has unexpected number ("#")`,
                                    });
                                }
                            }
                            if (
                                translationInstances.length !==
                                sourceInstances.length
                            ) {
                                results.push({
                                    severity: "warning",
                                    message: `Argument {${key}} appeared different times from source`,
                                });
                            }
                        }
                    });

                    const sourceKeys = new Set(sourceArgs.keys());
                    const extraKeys = [...translationArgs.keys()].filter(
                        (x) => !sourceKeys.has(x),
                    );
                    if (extraKeys.length > 0) {
                        results.push({
                            severity: "error",
                            message: `Translation has extra arguments: ${extraKeys.map((x) => `{${x}}`)}`,
                        });
                    }
                }
            }
        }
    } else if (translation.includes("{") || translation.includes("}")) {
        results.push({
            severity: "error",
            message: "Translation has unexpected curly braces",
        });
    }

    if (key === "locale" && locale !== translation) {
        results.push({
            severity: "error",
            message: `This string must be exactly "${locale}"`,
        });
    }

    return results.sort(
        (a, b) =>
            checkSeverityScore(b.severity) - checkSeverityScore(a.severity),
    );
}

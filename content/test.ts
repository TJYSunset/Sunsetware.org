import {
    escapeAndroid,
    unescapeAndroid,
} from "./src/phocid/translate/data/String.ts";

const reversibleTestData: [string, string][] = [
    ["", ""],
    ["a", "a"],
    ['"    "', "    "],
    ['" a "', " a "],
    ["\\t\\t", "\t\t"],
    ["\\n\\n", "\n\n"],
    ["\\@?\\n\\t\\'\\\"", "@?\n\t'\""],
    ["\\\\n\\\\t\\\\u0000", "\\n\\t\\u0000"],
    ["\\\\\\na", "\\\na"],
    ["\\'", "'"],
    ['" \'"', " '"],
];

const unescapeTestData: [string, string][] = [
    ['"', ""],
    [" ", ""],
    ['a"a', "aa"],
    ["    ", ""],
    ["    \t    ", ""],
    ["\\?\\@", "?\\@"],
    ["\\@\\?\\n\\t\\'\\\"", "@\\?\n\t'\""],
    ['"\\@\\?\\n\\t\\\'\\""', "@\\?\n\t'\""],
    ["\\@\\?\\n\\t\\u0000\\'\\\"", "@\\?\n\t\\u0000'\""],
    ['"\\@\\?\\n\\t\\u0000\\\'\\""', "@\\?\n\t\\u0000'\""],
    ["\\\\@\\\\?\\\\n\\\\t\\\\u0000\\\\'\\\\\"", "\\@\\?\\n\\t\\u0000\\'\\"],
    ['"\'"', "'"],
];

reversibleTestData.concat(unescapeTestData).forEach(([escaped, unescaped]) => {
    if (unescapeAndroid(escaped) !== unescaped) {
        throw new Error(
            `unescapeAndroid: input <${escaped}>, expected <${unescaped}>, actual <${unescapeAndroid(escaped)}>`,
        );
    }
});

reversibleTestData.forEach(([escaped, unescaped]) => {
    if (escapeAndroid(unescaped) !== escaped) {
        throw new Error(
            `escapeAndroid: input <${unescaped}>, expected <${escaped}>, actual <${escapeAndroid(unescaped)}>`,
        );
    }
});

console.log("Tests passed");

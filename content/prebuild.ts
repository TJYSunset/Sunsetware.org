// noinspection JSJQueryEfficiency

import asciidoctor from "asciidoctor";
// @ts-expect-error what the fuck
import * as cheerio from "cheerio";
// @ts-expect-error ...
import { toMerged } from "es-toolkit";
import * as Handlebars from "handlebars";
import * as fs from "node:fs";
import { Dirent } from "node:fs";
import * as path from "node:path";

const sourceDirectory = "src";
const l10nDirectory = "l10n";
const outputDirectory = "localized";

const Asciidoctor = asciidoctor();

// region Utils

// https://stackoverflow.com/a/33316734
Handlebars.registerHelper(
    "when",
    function (operand_1, operator, operand_2, options) {
        // noinspection JSUnusedGlobalSymbols
        const operators = {
                eq: function (l: unknown, r: unknown) {
                    return l === r;
                },
                ne: function (l: unknown, r: unknown) {
                    return l !== r;
                },
                lt: function (l: unknown, r: unknown) {
                    return Number(l) < Number(r);
                },
                gt: function (l: unknown, r: unknown) {
                    return Number(l) > Number(r);
                },
                and: function (l: unknown, r: unknown) {
                    return l && r;
                },
                or: function (l: unknown, r: unknown) {
                    return l || r;
                },
            },
            result = operators[operator](operand_1, operand_2);

        if (result) return options.fn(this);
        else return options.inverse(this);
    },
);

function toPath(dirent: Dirent) {
    return path.join(dirent.parentPath, dirent.name);
}

// endregion

fs.rmSync(outputDirectory, { recursive: true, force: true });
fs.mkdirSync(outputDirectory);

const sourceFiles = fs
    .readdirSync(sourceDirectory, {
        recursive: true,
        withFileTypes: true,
    })
    .filter((x) => x.isFile());
const partials = sourceFiles.filter(
    (x) => x.name.startsWith("_") && x.name.endsWith(".html"),
);
const localizablePages = sourceFiles.filter((x) => x.name == "index.html");
const invariantPages = sourceFiles.filter(
    (x) => !x.name.startsWith("_") && x.name.endsWith(".invariant.html"),
);
const locales = Map.groupBy(
    fs
        .readdirSync(l10nDirectory, {
            recursive: true,
            withFileTypes: true,
        })
        .filter((x) => x.isFile()),
    (x) => path.basename(x.parentPath),
);
const strings = new Map(
    [...locales].map(([locale, files]) => [
        locale,
        JSON.parse(
            fs.readFileSync(
                toPath(files.find((x) => x.name == "strings.json")),
                {
                    encoding: "utf8",
                },
            ),
        ),
    ]),
);

partials.forEach((file) => {
    Handlebars.registerPartial(
        path.posix.sep + toPath(file).replaceAll(path.sep, path.posix.sep),
        fs.readFileSync(toPath(file), {
            encoding: "utf8",
        }),
    );
});

function buildHandlebars(
    file: Dirent,
    locale: string | null,
    variables: object,
) {
    console.log(`${locale ?? "invariant"}: ${toPath(file)}`);
    const fileOutputDirectory = path.join(outputDirectory, file.parentPath);
    const html = fs.readFileSync(toPath(file), {
        encoding: "utf8",
    });
    const output = Handlebars.compile(html)({
        ...variables,
        __path__:
            path.posix.sep +
            file.parentPath.replaceAll(path.sep, path.posix.sep) +
            path.posix.sep,
    });
    try {
        fs.mkdirSync(fileOutputDirectory, { recursive: true });
    } catch {
        // ignored
    }
    fs.writeFileSync(
        path.join(
            fileOutputDirectory,
            `${locale ?? file.name.substring(0, file.name.length - ".invariant.html".length)}.html`,
        ),
        output,
        { encoding: "utf8" },
    );
}

const localeVariables = new Map(
    [...locales].map(([locale, files]) => {
        const asciidocs = files
            .filter((x) => x.name.endsWith(".adoc"))
            .reduce((obj, x) => {
                const adoc = Asciidoctor.load(
                    fs.readFileSync(toPath(x), {
                        encoding: "utf8",
                    }),
                );
                adoc.setAttribute("toc", "left", true);
                adoc.setAttribute("toclevels", "5", true);
                const title = adoc.getTitle();
                const $ = cheerio.load(
                    `<div id="root">${adoc.convert() as string}</div>`,
                );
                $("#toctitle").remove();
                const $toc = $("#root > .toc");
                const toc = $toc.html();
                $toc.remove();
                $("#root").prepend(`<h1>${title}</h1>`);
                $("#root > *").wrapAll('<article class="content"></div>');
                $("#root").prepend(`<nav id="toc" class="toc">${toc}</div>`);
                return {
                    ...obj,
                    [x.name]: $("#root").html(),
                };
            }, {});

        return [
            locale,
            {
                ...strings.get(locale),
                ...asciidocs,
                __locale__: locale,
                __locales__: [...strings].map(([l, strings]) => ({
                    code: l,
                    name: strings["locale"],
                    current: locale === l,
                })),
            },
        ] as [string, object];
    }),
);
localeVariables.forEach((variables, locale) => {
    const mergedVariables = toMerged(localeVariables.get("en"), variables);
    localizablePages.forEach((file) => {
        buildHandlebars(file, locale, mergedVariables);
    });
});

invariantPages.forEach((file) => {
    buildHandlebars(file, null, {});
});

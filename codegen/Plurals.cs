using System.Diagnostics.CodeAnalysis;
using System.Text;
using System.Text.Json;
using System.Text.RegularExpressions;
using System.Xml;

// List locales

var localeList = new Dictionary<string, string>();

var namesXml = new XmlDocument();
namesXml.LoadXml(File.ReadAllText("deps/cldr/common/main/en.xml", Encoding.UTF8));

foreach (XmlNode node in namesXml.GetElementsByTagName("languages")[0]!.ChildNodes)
{
    var locale = node.Attributes!["type"]!.Value.Replace('_', '-');
    if (localeList.ContainsKey(locale))
        continue;

    localeList[locale] = node.InnerText;
}

// Parse plural rules

var xml = new XmlDocument();
xml.LoadXml(File.ReadAllText("deps/cldr/common/supplemental/plurals.xml", Encoding.UTF8));

var ruleRegex = new Regex(@"^.*?(?=[$@])", RegexOptions.Compiled | RegexOptions.CultureInvariant);
var integerSamplesRegex = new Regex(
    @"(?<=@integer).*?(?=[$@])",
    RegexOptions.Compiled | RegexOptions.CultureInvariant
);
var decimalSamplesRegex = new Regex(
    @"(?<=@decimal).*?(?=[$@])",
    RegexOptions.Compiled | RegexOptions.CultureInvariant
);

var definedRules = xml.GetElementsByTagName("pluralRules")
    .Cast<XmlNode>()
    .SelectMany(node =>
    {
        var locales = node.Attributes!["locales"]!
            .Value.Split(' ')
            .Select(x => x.Replace('_', '-'))
            .Where(x => localeList.ContainsKey(x))
            .Select(locale => (Code: locale, Name: localeList[locale]));

        var rules = node
            .ChildNodes.Cast<XmlNode>()
            .Select(ruleNode =>
            {
                var count = ruleNode.Attributes!["count"]!.Value;
                var ruleMatch = ruleRegex.Match(ruleNode.InnerText);
                var rule = ruleMatch.Success ? ruleMatch.Value.Trim() : "";
                var samples = new[]
                {
                    integerSamplesRegex.Match(ruleNode.InnerText),
                    decimalSamplesRegex.Match(ruleNode.InnerText),
                }
                    .Where(x => x.Success)
                    .Select(x => x.Value.Trim())
                    .ToList();
                return new PluralRule(count, rule, samples);
            })
            .ToList();

        return locales.Select(locale => new PluralRules(locale.Code, locale.Name, rules));
    })
    .ToDictionary(x => x.LocaleCode, x => x);

var rules = localeList
    .OrderBy(x => x.Key)
    .Select(x =>
    {
        if (definedRules.TryGetValue(x.Key, out var rule))
        {
            return rule;
        }
        if (definedRules.TryGetValue(x.Key.Split('-').First(), out rule))
        {
            return rule with { LocaleCode = x.Key, LocaleName = x.Value };
        }

        return new PluralRules(x.Key, x.Value, [new PluralRule("other", "", [])]);
    })
    .ToList();

File.WriteAllText(
    "content/src/phocid/translate/data/plurals.generated.json",
    JsonSerializer.Serialize(
        rules,
        new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase }
    ),
    Encoding.UTF8
);

[SuppressMessage("ReSharper", "NotAccessedPositionalProperty.Global")]
record struct PluralRules(string LocaleCode, string LocaleName, List<PluralRule> Rules);

[SuppressMessage("ReSharper", "NotAccessedPositionalProperty.Global")]
record struct PluralRule(string Count, string Rule, List<string> Samples);

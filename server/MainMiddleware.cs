using System.Collections.Frozen;

namespace Sunsetware;

public class MainMiddleware
{
    private readonly RequestDelegate _next;
    private FrozenSet<string> HtmlFilesWithoutExtension { get; }
    private FrozenDictionary<string, string> HtmlCanonicalPaths { get; }

    /// <summary>
    ///     (path, (locale, base locale))
    /// </summary>
    private FrozenDictionary<string, FrozenDictionary<string, string>> HtmlLocales { get; }

    public MainMiddleware(RequestDelegate next, IWebHostEnvironment environment)
    {
        _next = next;

        var files = new HashSet<string>();
        var directories = new Queue<string>(["/"]);
        while (directories.Count > 0)
        {
            var directory = directories.Dequeue();
            foreach (var item in environment.WebRootFileProvider.GetDirectoryContents(directory))
            {
                var path = Path.Combine(directory, item.Name);
                if (item.IsDirectory)
                {
                    directories.Enqueue(path);
                }
                // also filter out status code pages
                else if (
                    Path.GetExtension(path) == ".html"
                    && char.IsAsciiLetter(Path.GetFileNameWithoutExtension(path).First())
                )
                {
                    files.Add(path);
                }
            }
        }
        HtmlFilesWithoutExtension = files
            .Select(x => x[..^".html".Length].Replace('\\', '/'))
            .ToFrozenSet();

        HtmlCanonicalPaths = files
            .SelectMany(x =>
            {
                var parent = ((Path.GetDirectoryName(x) ?? "").Replace('\\', '/') + '/').Replace(
                    "//",
                    "/"
                );
                return Path.GetFileName(x) == "index.html"
                    ? new[] { parent }
                    : new[] { parent, parent + Path.GetFileNameWithoutExtension(x) };
            })
            .Distinct()
            .SelectMany(x =>
                x.EndsWith('/')
                    ? new[] { (x, x), (x[..^1], x), (x + "index.html", x) }
                    : new[] { (x, x), (x + '/', x), (x + ".html", x) }
            )
            .ToDictionary()
            .ToFrozenDictionary(StringComparer.InvariantCultureIgnoreCase);

        HtmlLocales = files
            .GroupBy(Path.GetDirectoryName)
            .Select(group =>
                (
                    Key: ((group.Key ?? "").Replace('\\', '/') + '/').Replace("//", "/"),
                    Files: group
                        .Select(Path.GetFileName)
                        .Where(x => Path.GetExtension(x) == ".html")
                        .Select(x =>
                        {
                            var fullLocale =
                                Path.GetFileNameWithoutExtension(x) ?? throw new Exception();
                            return (fullLocale, GetBaseLocale(fullLocale));
                        })
                        .ToDictionary()
                        .ToFrozenDictionary()
                )
            )
            .Where(x => x.Files.Count > 0)
            .ToDictionary()
            .ToFrozenDictionary();
    }

    public async Task InvokeAsync(HttpContext context)
    {
        var headers = context.Request.GetTypedHeaders();
        if (
            context.GetEndpoint()?.RequestDelegate is null
            && (
                HttpMethods.IsGet(context.Request.Method)
                || HttpMethods.IsHead(context.Request.Method)
            )
            && context.Request.Path.HasValue
            && headers.Accept.Any(x => x.MatchesMediaType("text/html"))
        )
        {
            var requestPath = context.Request.Path.Value;

            // Make 404 actually return 404
            if (requestPath.StartsWith("/404"))
            {
                context.Response.Clear();
                context.Response.StatusCode = StatusCodes.Status404NotFound;
                await _next(context);
                return;
            }

            // Redirect to canonical path
            if (
                HtmlCanonicalPaths.TryGetValue(requestPath, out var canonicalPath)
                && !requestPath.Equals(canonicalPath, StringComparison.Ordinal)
            )
            {
                context.Response.Redirect(canonicalPath);
                return;
            }

            // Redirect to concrete locale
            if (requestPath.EndsWith('/') && HtmlLocales.TryGetValue(requestPath, out var locales))
            {
                if (locales.Count == 1)
                {
                    context.Request.Path = requestPath + "index.html";
                }
                else
                {
                    var locale = "en";
                    foreach (
                        var language in headers
                            .AcceptLanguage.OrderByDescending(x => x.Quality ?? 1)
                            .Select(x => x.Value.Value)
                            .Where(x => x != null)
                    )
                    {
                        if (locales.ContainsKey(language!))
                        {
                            locale = language;
                            break;
                        }

                        var baseLocale = GetBaseLocale(language!);
                        var match = locales.FirstOrDefault(x =>
                            baseLocale.Equals(x.Value, StringComparison.InvariantCultureIgnoreCase)
                        );
                        if (match.Key != null)
                        {
                            locale = match.Key;
                            break;
                        }
                    }

                    context.Response.Redirect(requestPath + locale);
                    return;
                }
            }

            // Add extension to HTML
            if (HtmlFilesWithoutExtension.Contains(requestPath))
            {
                context.Request.Path = requestPath + ".html";
            }
        }

        // Call the next delegate/middleware in the pipeline.
        await _next(context);
    }

    private static string GetBaseLocale(string locale)
    {
        var hyphen = locale.IndexOf('-');
        return hyphen < 0 ? locale : locale[..hyphen];
    }
}

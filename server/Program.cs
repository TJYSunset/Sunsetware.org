using System.Text;
using Microsoft.AspNetCore.Http.Features;
using Microsoft.Net.Http.Headers;
using Sunsetware;

var builder = WebApplication.CreateBuilder(args);
var app = builder.Build();

app.UseMiddleware<MainMiddleware>();
app.UseStaticFiles(
    new StaticFileOptions()
    {
        HttpsCompression = HttpsCompressionMode.Compress,
        OnPrepareResponse = (context) =>
        {
            var fileNameSegments = context
                .Context.Request.Path.Value?.Split('/')
                .LastOrDefault()
                ?.Split('.');
            var immutable = fileNameSegments != null && fileNameSegments.LastOrDefault() != "html";
            var headers = context.Context.Response.GetTypedHeaders();
            headers.CacheControl = new CacheControlHeaderValue
            {
                Public = true,
                MaxAge = immutable ? TimeSpan.FromDays(30) : TimeSpan.FromMinutes(1),
            };
        },
    }
);
var notFoundPage = File.ReadAllText(
    app.Environment.WebRootFileProvider.GetFileInfo("/404.html").PhysicalPath!,
    Encoding.UTF8
);
app.UseStatusCodePages(
    new StatusCodePagesOptions
    {
        HandleAsync = async (statusContext) =>
        {
            var context = statusContext.HttpContext;
            switch (context.Response.StatusCode)
            {
                case StatusCodes.Status404NotFound:
                    context.Response.Clear();
                    context.Response.StatusCode = StatusCodes.Status404NotFound;
                    await context.Response.WriteAsync(notFoundPage);
                    break;
            }
        },
    }
);

app.Run();

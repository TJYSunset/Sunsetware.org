Remove-Item **/*.generated.*
dotnet run --project codegen/Plurals.csproj
pnpm run --dir content build
dotnet publish server
Remove-Item publish.zip
7za a publish.zip ./server/bin/Release/net9.0/publish

FROM docker.io/ubuntu/dotnet-aspnet:9.0-24.10_stable@sha256:a5a421c370698b4df6e8c218106b4c1a9b1d8ed43aa36b5125d5e978d58a36a8
WORKDIR /app

COPY . ./

ENTRYPOINT ["dotnet", "Sunsetware.dll"]

# Build stage
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy csproj files va restore
COPY src/DataLabeling.Core/DataLabeling.Core.csproj src/DataLabeling.Core/
COPY src/DataLabeling.Application/DataLabeling.Application.csproj src/DataLabeling.Application/
COPY src/DataLabeling.Infrastructure/DataLabeling.Infrastructure.csproj src/DataLabeling.Infrastructure/
COPY src/DataLabeling.API/DataLabeling.API.csproj src/DataLabeling.API/
RUN dotnet restore src/DataLabeling.API/DataLabeling.API.csproj

# Copy toan bo source code va build
COPY src/ src/
RUN dotnet publish src/DataLabeling.API/DataLabeling.API.csproj -c Release -o /app/publish

# Runtime stage (image nhe hon)
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app
COPY --from=build /app/publish .

# Tao thu muc uploads
RUN mkdir -p /app/uploads

EXPOSE 8080
ENV ASPNETCORE_URLS=http://+:8080
ENTRYPOINT ["dotnet", "DataLabeling.API.dll"]

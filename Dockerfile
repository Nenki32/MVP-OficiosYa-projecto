# Imagen de la API. Construccion en dos etapas: la primera compila, la segunda
# solo lleva lo publicado. Asi la imagen final no incluye el SDK ni el codigo.

FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

# Se copia primero el csproj y se restauran las dependencias por separado:
# mientras el csproj no cambie, Docker reutiliza esta capa y no vuelve a
# descargar los paquetes en cada build.
COPY Marketplace.Api/Marketplace.Api.csproj Marketplace.Api/
RUN dotnet restore Marketplace.Api/Marketplace.Api.csproj

COPY Marketplace.Api/ Marketplace.Api/
RUN dotnet publish Marketplace.Api/Marketplace.Api.csproj -c Release -o /app/publish

FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS final
WORKDIR /app
COPY --from=build /app/publish .

# Las plataformas de hosting asignan el puerto por la variable PORT. Kestrel
# no la lee sola, asi que se traduce en el arranque. El 8080 es el valor por
# defecto si nadie define nada.
ENV ASPNETCORE_ENVIRONMENT=Production
EXPOSE 8080

# Escucha en todas las interfaces: dentro de un contenedor, localhost seria
# solo el propio contenedor y la plataforma no podria enrutar el trafico.
ENTRYPOINT ["sh", "-c", "ASPNETCORE_URLS=http://0.0.0.0:${PORT:-8080} dotnet Marketplace.Api.dll"]

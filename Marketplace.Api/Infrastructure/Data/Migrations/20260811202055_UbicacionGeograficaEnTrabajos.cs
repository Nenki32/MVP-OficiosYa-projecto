using Microsoft.EntityFrameworkCore.Migrations;
using NetTopologySuite.Geometries;

#nullable disable

namespace Marketplace.Api.Infrastructure.Data.Migrations
{
    /// <summary>
    /// Reemplaza latitud_destino y longitud_destino (dos numeric sueltos) por
    /// una columna geografica unica.
    ///
    /// Con un tipo geography, la distancia y el filtrado por radio se resuelven
    /// en la base con indice GiST; con dos decimales habria que traer todas las
    /// filas y calcular en memoria.
    ///
    /// ORDEN IMPORTANTE: el andamiaje generado por EF borraba las columnas
    /// viejas ANTES de crear la nueva, lo que habria perdido las coordenadas ya
    /// cargadas. Aca se crea primero, se copian los datos, y recien despues se
    /// borran las viejas.
    /// </summary>
    public partial class UbicacionGeograficaEnTrabajos : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // 1. Columna nueva
            migrationBuilder.AddColumn<Point>(
                name: "ubicacion",
                table: "Trabajos",
                type: "geography (point,4326)",
                nullable: true);

            // 2. Traspaso de datos. ST_MakePoint toma (longitud, latitud) en
            //    ese orden: X es longitud e Y latitud.
            migrationBuilder.Sql(@"
                UPDATE ""Trabajos""
                SET ubicacion = ST_SetSRID(
                        ST_MakePoint(longitud_destino::float8, latitud_destino::float8),
                        4326)::geography
                WHERE latitud_destino IS NOT NULL
                  AND longitud_destino IS NOT NULL;");

            // 3. Recien ahora se descartan las columnas viejas
            migrationBuilder.DropIndex(
                name: "ix_trabajos_estado_latitud_destino_longitud_destino",
                table: "Trabajos");

            migrationBuilder.DropColumn(
                name: "latitud_destino",
                table: "Trabajos");

            migrationBuilder.DropColumn(
                name: "longitud_destino",
                table: "Trabajos");

            // 4. Indices: el geografico para el filtrado por radio, y uno por
            //    estado, que es el filtro previo de toda busqueda.
            migrationBuilder.CreateIndex(
                name: "ix_trabajos_estado",
                table: "Trabajos",
                column: "estado",
                filter: "estado IN ('pendiente', 'aceptado')");

            migrationBuilder.CreateIndex(
                name: "ix_trabajos_ubicacion",
                table: "Trabajos",
                column: "ubicacion")
                .Annotation("Npgsql:IndexMethod", "gist");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<decimal>(
                name: "latitud_destino",
                table: "Trabajos",
                type: "numeric(10,7)",
                precision: 10,
                scale: 7,
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "longitud_destino",
                table: "Trabajos",
                type: "numeric(10,7)",
                precision: 10,
                scale: 7,
                nullable: true);

            // Traspaso inverso, para no perder datos al revertir.
            migrationBuilder.Sql(@"
                UPDATE ""Trabajos""
                SET latitud_destino  = ST_Y(ubicacion::geometry)::numeric(10,7),
                    longitud_destino = ST_X(ubicacion::geometry)::numeric(10,7)
                WHERE ubicacion IS NOT NULL;");

            migrationBuilder.DropIndex(name: "ix_trabajos_estado", table: "Trabajos");
            migrationBuilder.DropIndex(name: "ix_trabajos_ubicacion", table: "Trabajos");
            migrationBuilder.DropColumn(name: "ubicacion", table: "Trabajos");

            migrationBuilder.CreateIndex(
                name: "ix_trabajos_estado_latitud_destino_longitud_destino",
                table: "Trabajos",
                columns: new[] { "estado", "latitud_destino", "longitud_destino" },
                filter: "estado IN ('pendiente', 'aceptado')");
        }
    }
}

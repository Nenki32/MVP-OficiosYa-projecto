using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Marketplace.Api.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class FechaDeVisita : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "duracion_estimada_min",
                table: "Trabajos",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "fecha_visita",
                table: "Trabajos",
                type: "timestamp with time zone",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "duracion_estimada_min",
                table: "Trabajos");

            migrationBuilder.DropColumn(
                name: "fecha_visita",
                table: "Trabajos");
        }
    }
}

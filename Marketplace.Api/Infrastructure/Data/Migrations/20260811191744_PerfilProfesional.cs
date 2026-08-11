using Microsoft.EntityFrameworkCore.Migrations;
using NetTopologySuite.Geometries;

#nullable disable

namespace Marketplace.Api.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class PerfilProfesional : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "cuit",
                table: "Usuarios",
                type: "character varying(20)",
                maxLength: 20,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "descripcion",
                table: "Usuarios",
                type: "character varying(1000)",
                maxLength: 1000,
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "disponible",
                table: "Usuarios",
                type: "boolean",
                nullable: false,
                defaultValue: true);

            migrationBuilder.AddColumn<int>(
                name: "radio_cobertura_km",
                table: "Usuarios",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "razon_social",
                table: "Usuarios",
                type: "character varying(200)",
                maxLength: 200,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "tipo_perfil",
                table: "Usuarios",
                type: "character varying(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "persona");

            migrationBuilder.AddColumn<Point>(
                name: "ubicacion",
                table: "Usuarios",
                type: "geography (point,4326)",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "ix_usuarios_ubicacion",
                table: "Usuarios",
                column: "ubicacion")
                .Annotation("Npgsql:IndexMethod", "gist");

            migrationBuilder.AddCheckConstraint(
                name: "CK_Usuarios_empresa",
                table: "Usuarios",
                sql: "(tipo_perfil = 'persona' AND razon_social IS NULL AND cuit IS NULL) OR (tipo_perfil = 'empresa' AND razon_social IS NOT NULL)");

            migrationBuilder.AddCheckConstraint(
                name: "CK_Usuarios_radio",
                table: "Usuarios",
                sql: "radio_cobertura_km IS NULL OR radio_cobertura_km BETWEEN 1 AND 200");

            migrationBuilder.AddCheckConstraint(
                name: "CK_Usuarios_tipo_perfil",
                table: "Usuarios",
                sql: "tipo_perfil IN ('persona', 'empresa')");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "ix_usuarios_ubicacion",
                table: "Usuarios");

            migrationBuilder.DropCheckConstraint(
                name: "CK_Usuarios_empresa",
                table: "Usuarios");

            migrationBuilder.DropCheckConstraint(
                name: "CK_Usuarios_radio",
                table: "Usuarios");

            migrationBuilder.DropCheckConstraint(
                name: "CK_Usuarios_tipo_perfil",
                table: "Usuarios");

            migrationBuilder.DropColumn(
                name: "cuit",
                table: "Usuarios");

            migrationBuilder.DropColumn(
                name: "descripcion",
                table: "Usuarios");

            migrationBuilder.DropColumn(
                name: "disponible",
                table: "Usuarios");

            migrationBuilder.DropColumn(
                name: "radio_cobertura_km",
                table: "Usuarios");

            migrationBuilder.DropColumn(
                name: "razon_social",
                table: "Usuarios");

            migrationBuilder.DropColumn(
                name: "tipo_perfil",
                table: "Usuarios");

            migrationBuilder.DropColumn(
                name: "ubicacion",
                table: "Usuarios");
        }
    }
}

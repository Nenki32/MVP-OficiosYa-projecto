using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace Marketplace.Api.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterDatabase()
                .Annotation("Npgsql:PostgresExtension:postgis", ",,");

            migrationBuilder.CreateTable(
                name: "Servicios",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    nombre = table.Column<string>(type: "text", nullable: false),
                    descripcion = table.Column<string>(type: "text", nullable: true),
                    creado_en = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_servicios", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "Usuarios",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    email = table.Column<string>(type: "text", nullable: false),
                    password_hash = table.Column<string>(type: "text", nullable: false),
                    nombre = table.Column<string>(type: "text", nullable: false),
                    telefono = table.Column<string>(type: "text", nullable: true),
                    rol = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    nivel_profesional = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    dni = table.Column<string>(type: "text", nullable: true),
                    numero_matricula = table.Column<string>(type: "text", nullable: true),
                    estado = table.Column<int>(type: "integer", nullable: false),
                    creado_en = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    actualizado_en = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_usuarios", x => x.id);
                    table.CheckConstraint("CK_Usuarios_dni", "(rol = 'profesional' AND dni IS NOT NULL) OR (rol IN ('cliente', 'admin'))");
                    table.CheckConstraint("CK_Usuarios_matricula", "(rol = 'cliente' AND numero_matricula IS NULL) OR (rol = 'profesional' AND nivel_profesional = 'standard' AND numero_matricula IS NULL) OR (rol = 'profesional' AND nivel_profesional = 'premium' AND numero_matricula IS NOT NULL) OR (rol = 'admin' AND numero_matricula IS NULL)");
                    table.CheckConstraint("CK_Usuarios_nivel", "(rol = 'cliente' AND nivel_profesional IS NULL) OR (rol = 'profesional' AND nivel_profesional IN ('standard', 'premium')) OR (rol = 'admin' AND nivel_profesional IS NULL)");
                    table.CheckConstraint("CK_Usuarios_rol", "rol IN ('cliente', 'profesional', 'admin')");
                });

            migrationBuilder.CreateTable(
                name: "ProfesionalServicios",
                columns: table => new
                {
                    profesional_id = table.Column<int>(type: "integer", nullable: false),
                    servicio_id = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_profesional_servicios", x => new { x.profesional_id, x.servicio_id });
                    table.ForeignKey(
                        name: "fk_profesional_servicios_servicios_servicio_id",
                        column: x => x.servicio_id,
                        principalTable: "Servicios",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_profesional_servicios_usuarios_profesional_id",
                        column: x => x.profesional_id,
                        principalTable: "Usuarios",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Trabajos",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    cliente_id = table.Column<int>(type: "integer", nullable: false),
                    profesional_id = table.Column<int>(type: "integer", nullable: true),
                    servicio_id = table.Column<int>(type: "integer", nullable: false),
                    estado = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    descripcion = table.Column<string>(type: "text", nullable: true),
                    tipo_pago = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    latitud_destino = table.Column<decimal>(type: "numeric(10,7)", precision: 10, scale: 7, nullable: true),
                    longitud_destino = table.Column<decimal>(type: "numeric(10,7)", precision: 10, scale: 7, nullable: true),
                    direccion_destino = table.Column<string>(type: "text", nullable: true),
                    latitud_inicio = table.Column<decimal>(type: "numeric(10,7)", precision: 10, scale: 7, nullable: true),
                    longitud_inicio = table.Column<decimal>(type: "numeric(10,7)", precision: 10, scale: 7, nullable: true),
                    creado_en = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    actualizado_en = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_trabajos", x => x.id);
                    table.CheckConstraint("CK_Trabajos_estado", "estado IN ('pendiente', 'aceptado', 'viajando', 'en_progreso', 'completado', 'cancelado')");
                    table.CheckConstraint("CK_Trabajos_tipo_pago", "tipo_pago IN ('efectivo', 'tarjeta', 'transferencia')");
                    table.ForeignKey(
                        name: "fk_trabajos_servicios_servicio_id",
                        column: x => x.servicio_id,
                        principalTable: "Servicios",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_trabajos_usuarios_cliente_id",
                        column: x => x.cliente_id,
                        principalTable: "Usuarios",
                        principalColumn: "id");
                    table.ForeignKey(
                        name: "fk_trabajos_usuarios_profesional_id",
                        column: x => x.profesional_id,
                        principalTable: "Usuarios",
                        principalColumn: "id");
                });

            migrationBuilder.CreateTable(
                name: "CuentaCorriente",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    profesional_id = table.Column<int>(type: "integer", nullable: false),
                    trabajo_id = table.Column<int>(type: "integer", nullable: true),
                    tipo = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    monto = table.Column<decimal>(type: "numeric(10,2)", precision: 10, scale: 2, nullable: false),
                    saldo_posterior = table.Column<decimal>(type: "numeric(10,2)", precision: 10, scale: 2, nullable: false),
                    referencia = table.Column<string>(type: "text", nullable: true),
                    creado_en = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_cuenta_corriente", x => x.id);
                    table.CheckConstraint("CK_CC_tipo", "tipo IN ('comision_adeudada', 'pago_deuda', 'ajuste_manual')");
                    table.ForeignKey(
                        name: "fk_cuenta_corriente_trabajos_trabajo_id",
                        column: x => x.trabajo_id,
                        principalTable: "Trabajos",
                        principalColumn: "id");
                    table.ForeignKey(
                        name: "fk_cuenta_corriente_usuarios_profesional_id",
                        column: x => x.profesional_id,
                        principalTable: "Usuarios",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Pagos",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    trabajo_id = table.Column<int>(type: "integer", nullable: false),
                    monto_total = table.Column<decimal>(type: "numeric(10,2)", precision: 10, scale: 2, nullable: false),
                    comision = table.Column<decimal>(type: "numeric(10,2)", precision: 10, scale: 2, nullable: false),
                    tipo_pago = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    estado = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    creado_en = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_pagos", x => x.id);
                    table.CheckConstraint("CK_Pagos_estado", "estado IN ('registrado', 'conciliado', 'reembolsado')");
                    table.CheckConstraint("CK_Pagos_tipo_pago", "tipo_pago IN ('efectivo', 'tarjeta', 'transferencia')");
                    table.ForeignKey(
                        name: "fk_pagos_trabajos_trabajo_id",
                        column: x => x.trabajo_id,
                        principalTable: "Trabajos",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Postulaciones",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    trabajo_id = table.Column<int>(type: "integer", nullable: false),
                    profesional_id = table.Column<int>(type: "integer", nullable: false),
                    presupuesto = table.Column<decimal>(type: "numeric(10,2)", precision: 10, scale: 2, nullable: true),
                    creado_en = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_postulaciones", x => x.id);
                    table.ForeignKey(
                        name: "fk_postulaciones_trabajos_trabajo_id",
                        column: x => x.trabajo_id,
                        principalTable: "Trabajos",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_postulaciones_usuarios_profesional_id",
                        column: x => x.profesional_id,
                        principalTable: "Usuarios",
                        principalColumn: "id");
                });

            migrationBuilder.CreateTable(
                name: "Resenias",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    trabajo_id = table.Column<int>(type: "integer", nullable: false),
                    cliente_id = table.Column<int>(type: "integer", nullable: false),
                    profesional_id = table.Column<int>(type: "integer", nullable: false),
                    puntuacion = table.Column<byte>(type: "smallint", nullable: false),
                    comentario = table.Column<string>(type: "text", nullable: true),
                    creado_en = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("pk_resenias", x => x.id);
                    table.CheckConstraint("CK_Resenias_puntuacion", "puntuacion BETWEEN 1 AND 5");
                    table.ForeignKey(
                        name: "fk_resenias_trabajos_trabajo_id",
                        column: x => x.trabajo_id,
                        principalTable: "Trabajos",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "fk_resenias_usuarios_cliente_id",
                        column: x => x.cliente_id,
                        principalTable: "Usuarios",
                        principalColumn: "id");
                    table.ForeignKey(
                        name: "fk_resenias_usuarios_profesional_id",
                        column: x => x.profesional_id,
                        principalTable: "Usuarios",
                        principalColumn: "id");
                });

            migrationBuilder.InsertData(
                table: "Servicios",
                columns: new[] { "id", "creado_en", "descripcion", "nombre" },
                values: new object[,]
                {
                    { 1, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Instalacion, reparacion y mantenimiento de artefactos a gas", "Gasista" },
                    { 2, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Instalaciones electricas, reparaciones y certificaciones", "Electricista" },
                    { 3, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Reparacion de canerias, termotanques y sanitarios", "Plomero" },
                    { 4, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Pintura interior y exterior, enduido y revestimientos", "Pintor" },
                    { 5, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Apertura de puertas, cambio de cerraduras y copias", "Cerrajero" },
                    { 6, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Muebles a medida, reparacion de aberturas y colocacion", "Carpintero" },
                    { 7, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Arreglos de paredes, contrapisos y revoques", "Albanil" },
                    { 8, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Reparacion de techos, filtraciones y membranas", "Techista" },
                    { 9, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Corte de cesped, poda, diseno de jardines", "Jardinero" },
                    { 10, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Reparacion de electrodomesticos y equipos electronicos", "Servicio Tecnico" }
                });

            migrationBuilder.CreateIndex(
                name: "ix_cuenta_corriente_profesional_id_creado_en",
                table: "CuentaCorriente",
                columns: new[] { "profesional_id", "creado_en" },
                descending: new[] { false, true });

            migrationBuilder.CreateIndex(
                name: "ix_cuenta_corriente_trabajo_id",
                table: "CuentaCorriente",
                column: "trabajo_id");

            migrationBuilder.CreateIndex(
                name: "ix_pagos_trabajo_id",
                table: "Pagos",
                column: "trabajo_id",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_postulaciones_profesional_id",
                table: "Postulaciones",
                column: "profesional_id");

            migrationBuilder.CreateIndex(
                name: "ix_postulaciones_trabajo_id_profesional_id",
                table: "Postulaciones",
                columns: new[] { "trabajo_id", "profesional_id" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_profesional_servicios_servicio_id",
                table: "ProfesionalServicios",
                column: "servicio_id");

            migrationBuilder.CreateIndex(
                name: "ix_resenias_cliente_id",
                table: "Resenias",
                column: "cliente_id");

            migrationBuilder.CreateIndex(
                name: "ix_resenias_profesional_id_puntuacion",
                table: "Resenias",
                columns: new[] { "profesional_id", "puntuacion" });

            migrationBuilder.CreateIndex(
                name: "ix_resenias_trabajo_id",
                table: "Resenias",
                column: "trabajo_id",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_trabajos_cliente_id_estado",
                table: "Trabajos",
                columns: new[] { "cliente_id", "estado" });

            migrationBuilder.CreateIndex(
                name: "ix_trabajos_estado_latitud_destino_longitud_destino",
                table: "Trabajos",
                columns: new[] { "estado", "latitud_destino", "longitud_destino" },
                filter: "estado IN ('pendiente', 'aceptado')");

            migrationBuilder.CreateIndex(
                name: "ix_trabajos_profesional_id_estado",
                table: "Trabajos",
                columns: new[] { "profesional_id", "estado" });

            migrationBuilder.CreateIndex(
                name: "ix_trabajos_servicio_id",
                table: "Trabajos",
                column: "servicio_id");

            migrationBuilder.CreateIndex(
                name: "ix_usuarios_email",
                table: "Usuarios",
                column: "email",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "CuentaCorriente");

            migrationBuilder.DropTable(
                name: "Pagos");

            migrationBuilder.DropTable(
                name: "Postulaciones");

            migrationBuilder.DropTable(
                name: "ProfesionalServicios");

            migrationBuilder.DropTable(
                name: "Resenias");

            migrationBuilder.DropTable(
                name: "Trabajos");

            migrationBuilder.DropTable(
                name: "Servicios");

            migrationBuilder.DropTable(
                name: "Usuarios");
        }
    }
}

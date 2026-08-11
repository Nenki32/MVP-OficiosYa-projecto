using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Marketplace.Api.Infrastructure.Data.Migrations
{
    /// <summary>
    /// Activa Row Level Security en todas las tablas del esquema public.
    ///
    /// Por que hace falta: Supabase expone el esquema public a traves de
    /// PostgREST, una API REST automatica accesible con la clave anonima. Esa
    /// clave esta pensada para viajar embebida en aplicaciones cliente, asi que
    /// no es un secreto fuerte. Sin RLS, quien la obtenga puede leer y escribir
    /// todas las tablas salteandose por completo la API y su autorizacion.
    ///
    /// Por que no rompe nada: la API se conecta con el rol 'postgres', que es
    /// dueño de las tablas y tiene BYPASSRLS. RLS no aplica sobre el. Los roles
    /// 'anon' y 'authenticated' que usa PostgREST si quedan alcanzados, y como
    /// no se define ninguna politica, no ven ninguna fila.
    ///
    /// Se usa ENABLE y no FORCE a proposito: FORCE aplicaria RLS tambien al
    /// dueño de la tabla, y eso si dejaria a la API sin acceso.
    /// </summary>
    public partial class HabilitarRls : Migration
    {
        private static readonly string[] Tablas =
        [
            "Usuarios",
            "Servicios",
            "ProfesionalServicios",
            "Trabajos",
            "Postulaciones",
            "Pagos",
            "CuentaCorriente",
            "Resenias",
            "__EFMigrationsHistory",
        ];

        protected override void Up(MigrationBuilder migrationBuilder)
        {
            foreach (var tabla in Tablas)
                migrationBuilder.Sql(
                    $"ALTER TABLE public.\"{tabla}\" ENABLE ROW LEVEL SECURITY;");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            foreach (var tabla in Tablas)
                migrationBuilder.Sql(
                    $"ALTER TABLE public.\"{tabla}\" DISABLE ROW LEVEL SECURITY;");
        }
    }
}

using Microsoft.EntityFrameworkCore;
using Marketplace.Api.Core.Models;

namespace Marketplace.Api.Infrastructure.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<Usuario> Usuarios => Set<Usuario>();
    public DbSet<Servicio> Servicios => Set<Servicio>();
    public DbSet<ProfesionalServicio> ProfesionalServicios => Set<ProfesionalServicio>();
    public DbSet<Trabajo> Trabajos => Set<Trabajo>();
    public DbSet<Pago> Pagos => Set<Pago>();
    public DbSet<CuentaCorriente> CuentaCorriente => Set<CuentaCorriente>();
    public DbSet<Resenia> Resenias => Set<Resenia>();
    public DbSet<Postulacion> Postulaciones => Set<Postulacion>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Usuario>(e =>
        {
            e.ToTable("Usuarios");
            e.HasIndex(u => u.Email).IsUnique();
            e.Property(u => u.Rol).HasMaxLength(20);
            e.Property(u => u.NivelProfesional).HasMaxLength(20);

            e.ToTable(t => t.HasCheckConstraint("CK_Usuarios_rol", "rol IN ('cliente', 'profesional', 'admin')"));
            e.ToTable(t => t.HasCheckConstraint("CK_Usuarios_nivel",
                "(rol = 'cliente' AND nivel_profesional IS NULL) OR " +
                "(rol = 'profesional' AND nivel_profesional IN ('standard', 'premium')) OR " +
                "(rol = 'admin' AND nivel_profesional IS NULL)"));
            e.ToTable(t => t.HasCheckConstraint("CK_Usuarios_dni",
                "(rol = 'profesional' AND dni IS NOT NULL) OR " +
                "(rol IN ('cliente', 'admin'))"));
            e.ToTable(t => t.HasCheckConstraint("CK_Usuarios_matricula",
                "(rol = 'cliente' AND numero_matricula IS NULL) OR " +
                "(rol = 'profesional' AND nivel_profesional = 'standard' AND numero_matricula IS NULL) OR " +
                "(rol = 'profesional' AND nivel_profesional = 'premium' AND numero_matricula IS NOT NULL) OR " +
                "(rol = 'admin' AND numero_matricula IS NULL)"));
        });

        modelBuilder.Entity<Servicio>(e => e.ToTable("Servicios"));

        modelBuilder.Entity<ProfesionalServicio>(e =>
        {
            e.ToTable("ProfesionalServicios");
            e.HasKey(ps => new { ps.ProfesionalId, ps.ServicioId });
            e.HasOne(ps => ps.Profesional)
                .WithMany(u => u.Servicios)
                .HasForeignKey(ps => ps.ProfesionalId)
                .OnDelete(DeleteBehavior.Cascade);
            e.HasOne(ps => ps.Servicio)
                .WithMany(s => s.Profesionales)
                .HasForeignKey(ps => ps.ServicioId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<Trabajo>(e =>
        {
            e.ToTable("Trabajos");
            e.HasOne(t => t.Cliente)
                .WithMany(u => u.TrabajosComoCliente)
                .HasForeignKey(t => t.ClienteId)
                .OnDelete(DeleteBehavior.NoAction);
            e.HasOne(t => t.Profesional)
                .WithMany(u => u.TrabajosComoProfesional)
                .HasForeignKey(t => t.ProfesionalId)
                .OnDelete(DeleteBehavior.NoAction);
            e.Property(t => t.Estado).HasMaxLength(20);
            e.Property(t => t.TipoPago).HasMaxLength(20);

            // Coordenadas: sin esto EF mapea decimal(18,2) por defecto y redondea
            // la posicion a 2 decimales (~1 km) antes de llegar a SQL Server.
            e.Property(t => t.LatitudDestino).HasPrecision(10, 7);
            e.Property(t => t.LongitudDestino).HasPrecision(10, 7);
            e.Property(t => t.LatitudInicio).HasPrecision(10, 7);
            e.Property(t => t.LongitudInicio).HasPrecision(10, 7);

            e.ToTable(t => t.HasCheckConstraint("CK_Trabajos_estado",
                "estado IN ('pendiente', 'aceptado', 'viajando', 'en_progreso', 'completado', 'cancelado')"));
            e.ToTable(t => t.HasCheckConstraint("CK_Trabajos_tipo_pago",
                "tipo_pago IN ('efectivo', 'tarjeta', 'transferencia')"));
            e.HasIndex(t => new { t.Estado, t.LatitudDestino, t.LongitudDestino })
                .HasFilter("estado IN ('pendiente', 'aceptado')");
            e.HasIndex(t => new { t.ClienteId, t.Estado });
            e.HasIndex(t => new { t.ProfesionalId, t.Estado });
        });

        modelBuilder.Entity<Pago>(e =>
        {
            e.ToTable("Pagos");
            e.HasOne(p => p.Trabajo)
                .WithOne(t => t.Pago)
                .HasForeignKey<Pago>(p => p.TrabajoId)
                .OnDelete(DeleteBehavior.Cascade);
            e.Property(p => p.TipoPago).HasMaxLength(20);
            e.Property(p => p.Estado).HasMaxLength(20);
            e.Property(p => p.MontoTotal).HasPrecision(10, 2);
            e.Property(p => p.Comision).HasPrecision(10, 2);
            e.ToTable(t => t.HasCheckConstraint("CK_Pagos_tipo_pago",
                "tipo_pago IN ('efectivo', 'tarjeta', 'transferencia')"));
            e.ToTable(t => t.HasCheckConstraint("CK_Pagos_estado",
                "estado IN ('registrado', 'conciliado', 'reembolsado')"));
        });

        modelBuilder.Entity<CuentaCorriente>(e =>
        {
            e.ToTable("CuentaCorriente");
            e.HasOne(cc => cc.Profesional)
                .WithMany(u => u.CuentaCorriente)
                .HasForeignKey(cc => cc.ProfesionalId)
                .OnDelete(DeleteBehavior.Cascade);
            e.HasOne(cc => cc.Trabajo)
                .WithMany(t => t.CuentaCorriente)
                .HasForeignKey(cc => cc.TrabajoId)
                .OnDelete(DeleteBehavior.NoAction);
            e.Property(cc => cc.Tipo).HasMaxLength(30);
            e.Property(cc => cc.Monto).HasPrecision(10, 2);
            e.Property(cc => cc.SaldoPosterior).HasPrecision(10, 2);
            e.ToTable(t => t.HasCheckConstraint("CK_CC_tipo",
                "tipo IN ('comision_adeudada', 'pago_deuda', 'ajuste_manual')"));
            e.HasIndex(cc => new { cc.ProfesionalId, cc.CreadoEn })
                .IsDescending(false, true);
        });

        modelBuilder.Entity<Postulacion>(e =>
        {
            e.ToTable("Postulaciones");
            e.HasOne(p => p.Trabajo)
                .WithMany(t => t.Postulaciones)
                .HasForeignKey(p => p.TrabajoId)
                .OnDelete(DeleteBehavior.Cascade);
            e.HasOne(p => p.Profesional)
                .WithMany()
                .HasForeignKey(p => p.ProfesionalId)
                .OnDelete(DeleteBehavior.NoAction);
            e.Property(p => p.Presupuesto).HasPrecision(10, 2);
            e.HasIndex(p => new { p.TrabajoId, p.ProfesionalId }).IsUnique();
        });

        modelBuilder.Entity<Resenia>(e =>
        {
            e.ToTable("Resenias");
            e.HasIndex(r => r.TrabajoId).IsUnique();
            e.HasOne(r => r.Cliente)
                .WithMany(u => u.ReseniasEscritas)
                .HasForeignKey(r => r.ClienteId)
                .OnDelete(DeleteBehavior.NoAction);
            e.HasOne(r => r.Profesional)
                .WithMany(u => u.ReseniasRecibidas)
                .HasForeignKey(r => r.ProfesionalId)
                .OnDelete(DeleteBehavior.NoAction);
            e.ToTable(t => t.HasCheckConstraint("CK_Resenias_puntuacion",
                "puntuacion BETWEEN 1 AND 5"));
            e.HasIndex(r => new { r.ProfesionalId, r.Puntuacion });
        });

        SeedData(modelBuilder);
    }

    // Fecha fija: HasData exige valores deterministas. Con DateTime.UtcNow, EF ve un
    // modelo distinto en cada ejecucion y genera una migracion nueva cada vez.
    private static readonly DateTime SeedFecha =
        new(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc);

    private static void SeedData(ModelBuilder mb)
    {
        mb.Entity<Servicio>().HasData(
            new { Id = 1, Nombre = "Gasista",        Descripcion = "Instalacion, reparacion y mantenimiento de artefactos a gas", CreadoEn = SeedFecha },
            new { Id = 2, Nombre = "Electricista",   Descripcion = "Instalaciones electricas, reparaciones y certificaciones",     CreadoEn = SeedFecha },
            new { Id = 3, Nombre = "Plomero",         Descripcion = "Reparacion de canerias, termotanques y sanitarios",          CreadoEn = SeedFecha },
            new { Id = 4, Nombre = "Pintor",          Descripcion = "Pintura interior y exterior, enduido y revestimientos",     CreadoEn = SeedFecha },
            new { Id = 5, Nombre = "Cerrajero",       Descripcion = "Apertura de puertas, cambio de cerraduras y copias",       CreadoEn = SeedFecha },
            new { Id = 6, Nombre = "Carpintero",      Descripcion = "Muebles a medida, reparacion de aberturas y colocacion",   CreadoEn = SeedFecha },
            new { Id = 7, Nombre = "Albanil",         Descripcion = "Arreglos de paredes, contrapisos y revoques",              CreadoEn = SeedFecha },
            new { Id = 8, Nombre = "Techista",        Descripcion = "Reparacion de techos, filtraciones y membranas",           CreadoEn = SeedFecha },
            new { Id = 9, Nombre = "Jardinero",       Descripcion = "Corte de cesped, poda, diseno de jardines",               CreadoEn = SeedFecha },
            new { Id = 10, Nombre = "Servicio Tecnico", Descripcion = "Reparacion de electrodomesticos y equipos electronicos", CreadoEn = SeedFecha }
        );
    }
}

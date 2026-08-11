using System.Text;
using DotNetEnv;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using Marketplace.Api.Core.Interfaces;
using Marketplace.Api.Core.UseCases;
using Marketplace.Api.Delivery.Middleware;
using Marketplace.Api.Infrastructure.Data;
using Marketplace.Api.Infrastructure.Data.Repositories;
using Marketplace.Api.Infrastructure.Security;

// El .env es solo una comodidad para desarrollo local. En un servidor no
// existe, y su ausencia no debe impedir el arranque: ahi la configuracion
// llega por variables de entorno de la plataforma.
try { Env.Load(); } catch { /* sin .env: se usan las variables del entorno */ }

var builder = WebApplication.CreateBuilder(args);

// Lee primero la variable de entorno del proceso (la que define la plataforma
// de hosting) y cae al .env solo si no esta definida.
static string? Cfg(string clave) =>
    Environment.GetEnvironmentVariable(clave) ?? Env.GetString(clave);

builder.Configuration.AddInMemoryCollection(new Dictionary<string, string?>
{
    ["ConnectionStrings:DefaultConnection"] = Cfg("DB_CONNECTION"),
    ["Jwt:Key"] = Cfg("JWT_KEY"),
    ["Jwt:Issuer"] = Cfg("JWT_ISSUER"),
    ["Jwt:Audience"] = Cfg("JWT_AUDIENCE"),
    ["Admin:Email"] = Cfg("ADMIN_EMAIL"),
    ["Admin:Password"] = Cfg("ADMIN_PASSWORD"),
});

// Fallar temprano y con un mensaje claro es mucho mejor que una
// NullReferenceException a mitad del arranque en un servidor remoto.
foreach (var (clave, valor) in new[]
{
    ("DB_CONNECTION", builder.Configuration.GetConnectionString("DefaultConnection")),
    ("JWT_KEY", builder.Configuration["Jwt:Key"]),
})
{
    if (string.IsNullOrWhiteSpace(valor))
        throw new InvalidOperationException(
            $"Falta la variable de entorno {clave}. En local va en Marketplace.Api/.env; " +
            "en el servidor, en la configuracion de la plataforma.");
}

var connString = builder.Configuration.GetConnectionString("DefaultConnection")!;

// Infrastructure
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(connString, npgsql =>
    {
        npgsql.UseNetTopologySuite();          // tipos geograficos para el Bloque 3
        npgsql.EnableRetryOnFailure(3);        // Supabase es remoto: reintenta fallos transitorios
    })
    .UseSnakeCaseNamingConvention());

builder.Services.AddScoped<IUnitOfWork, UnitOfWork>();

// Repositories
builder.Services.AddScoped<IUsuarioRepository, UsuarioRepository>();
builder.Services.AddScoped<ITrabajoRepository, TrabajoRepository>();
builder.Services.AddScoped<ICuentaCorrienteRepository, CuentaCorrienteRepository>();
builder.Services.AddScoped<IPostulacionRepository, PostulacionRepository>();

// Security services
builder.Services.AddScoped<IJwtService, JwtService>();
builder.Services.AddScoped<IPasswordHasher, PasswordHasher>();

// Use cases (Core)
builder.Services.AddScoped<IAuthService, AuthUseCase>();
builder.Services.AddScoped<ITrabajoService, TrabajoUseCase>();
builder.Services.AddScoped<ICuentaCorrienteService, CuentaCorrienteUseCase>();

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidAudience = builder.Configuration["Jwt:Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"]!))
        };
    });

builder.Services.AddAuthorization();

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "Marketplace Servicios API",
        Version = "v1",
        Description = "MVP - Marketplace de servicios del hogar con geolocalizacion"
    });

    options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "Ingresar token JWT"
    });

    options.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

// CORS: abierto solo en desarrollo. En produccion se restringe a los origenes
// declarados en Cors:AllowedOrigins (separados por coma en la variable CORS_ORIGINS).
var corsOrigins = (Env.GetString("CORS_ORIGINS") ?? "")
    .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);

builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        if (builder.Environment.IsDevelopment())
        {
            policy.AllowAnyOrigin()
                  .AllowAnyHeader()
                  .AllowAnyMethod();
        }
        else
        {
            policy.WithOrigins(corsOrigins)
                  .AllowAnyHeader()
                  .AllowAnyMethod()
                  .AllowCredentials();
        }
    });
});

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

    if (!await db.Usuarios.AnyAsync(u => u.Rol == "admin"))
    {
        var adminEmail = builder.Configuration["Admin:Email"] ?? "admin@oficiosya.com";
        var adminPass = builder.Configuration["Admin:Password"] ?? "Admin123!";

        db.Usuarios.Add(new Marketplace.Api.Core.Models.Usuario
        {
            Email = adminEmail,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(adminPass),
            Nombre = "Administrador",
            Rol = "admin"
        });

        await db.SaveChangesAsync();
        Console.WriteLine($"> Admin creado: {adminEmail} / {adminPass}");
    }
}

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c => c.ConfigObject.AdditionalItems["persistAuthorization"] = true);
}

// Chequeo de salud para la plataforma de hosting. No toca la base a proposito:
// responde si el proceso esta vivo, que es lo unico que necesita saber quien
// enruta el trafico. Sin autenticacion, porque lo consulta la infraestructura.
app.MapGet("/health", () => Results.Ok(new
{
    estado = "ok",
    servicio = "oficiosya-api",
    hora = DateTime.UtcNow,
})).AllowAnonymous();

// Delivery middleware pipeline
app.UseMiddleware<ErrorHandlingMiddleware>();
app.UseCors();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

app.Run();

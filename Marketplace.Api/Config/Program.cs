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

Env.Load();

var builder = WebApplication.CreateBuilder(args);

builder.Configuration.AddInMemoryCollection(new Dictionary<string, string?>
{
    ["ConnectionStrings:DefaultConnection"] = Env.GetString("DB_CONNECTION"),
    ["Jwt:Key"] = Env.GetString("JWT_KEY"),
    ["Jwt:Issuer"] = Env.GetString("JWT_ISSUER"),
    ["Jwt:Audience"] = Env.GetString("JWT_AUDIENCE"),
    ["Admin:Email"] = Env.GetString("ADMIN_EMAIL"),
    ["Admin:Password"] = Env.GetString("ADMIN_PASSWORD"),
});

var connString = builder.Configuration.GetConnectionString("DefaultConnection")!;

// Infrastructure
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(connString)
           .UseSnakeCaseNamingConvention());

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

builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

    if (!await db.Usuarios.AnyAsync(u => u.Rol == "admin"))
    {
        var adminEmail = builder.Configuration["Admin:Email"] ?? "admin@encoya.com";
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

// Delivery middleware pipeline
app.UseMiddleware<ErrorHandlingMiddleware>();
app.UseCors();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

app.Run();

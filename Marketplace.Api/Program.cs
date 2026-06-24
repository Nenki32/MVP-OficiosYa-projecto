using System.Text;
using DotNetEnv;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using Marketplace.Api.Data;
using Marketplace.Api.Services;

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

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(connString)
           .UseSnakeCaseNamingConvention());

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

builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<ITrabajoService, TrabajoService>();
builder.Services.AddScoped<ICuentaCorrienteService, CuentaCorrienteService>();

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

        db.Usuarios.Add(new Marketplace.Api.Models.Usuario
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
    app.UseSwaggerUI();
}

app.UseCors();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

app.Run();

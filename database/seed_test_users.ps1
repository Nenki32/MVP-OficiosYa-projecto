# Seed test users via API
# Requires: dotnet run (backend on localhost:5100)

$api = "http://localhost:5100/api"

Write-Host "Registrando usuarios de prueba..." -ForegroundColor Cyan

# Clientes
Invoke-RestMethod -Uri "$api/auth/register/cliente" -Method Post -Body (@{
    email = "juan@test.com"
    password = "Test1234!"
    nombre = "Juan Perez"
    telefono = "1111111111"
    dni = "30123456"
} | ConvertTo-Json) -ContentType "application/json"

Invoke-RestMethod -Uri "$api/auth/register/cliente" -Method Post -Body (@{
    email = "maria@test.com"
    password = "Test1234!"
    nombre = "Maria Garcia"
    telefono = "2222222222"
    dni = "30987654"
} | ConvertTo-Json) -ContentType "application/json"

# Profesional standard (no matriculado)
Invoke-RestMethod -Uri "$api/auth/register/profesional" -Method Post -Body (@{
    email = "carlos@test.com"
    password = "Test1234!"
    nombre = "Carlos Lopez"
    telefono = "3333333333"
    dni = "27123456"
    nivelProfesional = "standard"
} | ConvertTo-Json) -ContentType "application/json"

# Profesional premium (matriculado)
Invoke-RestMethod -Uri "$api/auth/register/profesional" -Method Post -Body (@{
    email = "pedro@test.com"
    password = "Test1234!"
    nombre = "Pedro Martinez"
    telefono = "4444444444"
    dni = "27111222"
    nivelProfesional = "premium"
    numeroMatricula = "MAT-2024-00123"
} | ConvertTo-Json) -ContentType "application/json"

Write-Host "Usuarios creados exitosamente!" -ForegroundColor Green

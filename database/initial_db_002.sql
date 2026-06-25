-- ============================================================
-- initial_db_sqlserver.sql
-- MVP Marketplace Servicios del Hogar
-- Motor: SQL Server Express
-- Author: CTO
-- ============================================================

-- La base se crea solo si no existe (idempotente para dev)
IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = 'MarketplaceServicios')
BEGIN
    CREATE DATABASE MarketplaceServicios;
END
GO

USE MarketplaceServicios;
GO

-- ============================================================
-- USUARIOS / PERFILES
-- Roles: cliente | profesional
-- Niveles: standard (DNI) | premium (matriculado)
-- ============================================================
IF OBJECT_ID(N'dbo.Usuarios', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.Usuarios (
        id                INT IDENTITY(1,1)   NOT NULL,
        email             NVARCHAR(255)       NOT NULL,
        password_hash     NVARCHAR(500)       NOT NULL,
        nombre            NVARCHAR(200)       NOT NULL,
        telefono          NVARCHAR(50)        NULL,
        rol               NVARCHAR(20)        NOT NULL,
        nivel_profesional NVARCHAR(20)        NULL,
        dni               NVARCHAR(20)        NULL,
        numero_matricula  NVARCHAR(50)        NULL,
        creado_en         DATETIME2           NOT NULL DEFAULT SYSUTCDATETIME(),
        actualizado_en    DATETIME2           NOT NULL DEFAULT SYSUTCDATETIME(),

        CONSTRAINT PK_Usuarios              PRIMARY KEY CLUSTERED (id),
        CONSTRAINT UQ_Usuarios_email        UNIQUE (email),
        CONSTRAINT CK_Usuarios_rol          CHECK (rol IN ('cliente', 'profesional', 'admin')),
        CONSTRAINT CK_Usuarios_nivel        CHECK (
            (rol = 'cliente' AND nivel_profesional IS NULL)
            OR (rol = 'profesional' AND nivel_profesional IN ('standard', 'premium'))
            OR (rol = 'admin' AND nivel_profesional IS NULL)
        ),
        CONSTRAINT CK_Usuarios_dni          CHECK (
            (rol = 'cliente' AND dni IS NULL)
            OR (rol = 'profesional' AND dni IS NOT NULL)
            OR (rol = 'admin' AND dni IS NULL)
        ),
        CONSTRAINT CK_Usuarios_matricula    CHECK (
            (rol = 'cliente' AND numero_matricula IS NULL)
            OR (rol = 'profesional' AND nivel_profesional = 'standard' AND numero_matricula IS NULL)
            OR (rol = 'profesional' AND nivel_profesional = 'premium' AND numero_matricula IS NOT NULL)
            OR (rol = 'admin' AND numero_matricula IS NULL)
        )
    );
END
GO

-- ============================================================
-- CATEGORÍAS DE SERVICIOS
-- ============================================================
IF OBJECT_ID(N'dbo.Servicios', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.Servicios (
        id          INT IDENTITY(1,1)   NOT NULL,
        nombre      NVARCHAR(100)       NOT NULL,
        descripcion NVARCHAR(500)       NULL,
        creado_en   DATETIME2           NOT NULL DEFAULT SYSUTCDATETIME(),

        CONSTRAINT PK_Servicios PRIMARY KEY CLUSTERED (id),
        CONSTRAINT UQ_Servicios_nombre UNIQUE (nombre)
    );
END
GO

-- ============================================================
-- RELACIÓN PROFESIONAL <-> SERVICIOS (M:N)
-- ============================================================
IF OBJECT_ID(N'dbo.ProfesionalServicios', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.ProfesionalServicios (
        profesional_id INT NOT NULL,
        servicio_id    INT NOT NULL,

        CONSTRAINT PK_ProfesionalServicios PRIMARY KEY CLUSTERED (profesional_id, servicio_id),
        CONSTRAINT FK_PS_Usuario   FOREIGN KEY (profesional_id) REFERENCES dbo.Usuarios(id) ON DELETE CASCADE,
        CONSTRAINT FK_PS_Servicio  FOREIGN KEY (servicio_id)    REFERENCES dbo.Servicios(id) ON DELETE CASCADE
    );
END
GO

-- ============================================================
-- TRABAJOS / SOLICITUDES
-- Estados: pendiente -> aceptado -> viajando -> en_progreso -> completado
--          cualquier -> cancelado
-- ============================================================
IF OBJECT_ID(N'dbo.Trabajos', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.Trabajos (
        id              INT IDENTITY(1,1)   NOT NULL,
        cliente_id      INT                 NOT NULL,
        profesional_id  INT                 NULL,
        servicio_id     INT                 NOT NULL,
        estado          NVARCHAR(20)        NOT NULL DEFAULT 'pendiente',
        descripcion     NVARCHAR(1000)      NULL,
        tipo_pago       NVARCHAR(20)        NOT NULL DEFAULT 'efectivo',

        -- coordenadas destino (donde se realiza el servicio)
        latitud_destino  DECIMAL(10,7)      NULL,
        longitud_destino DECIMAL(10,7)      NULL,
        direccion_destino NVARCHAR(500)     NULL,

        -- coordenadas de inicio del profesional cuando arranca el viaje
        latitud_inicio   DECIMAL(10,7)      NULL,
        longitud_inicio  DECIMAL(10,7)      NULL,

        creado_en       DATETIME2           NOT NULL DEFAULT SYSUTCDATETIME(),
        actualizado_en  DATETIME2           NOT NULL DEFAULT SYSUTCDATETIME(),

        CONSTRAINT PK_Trabajos            PRIMARY KEY CLUSTERED (id),
        CONSTRAINT FK_Trabajos_Cliente    FOREIGN KEY (cliente_id)     REFERENCES dbo.Usuarios(id),
        CONSTRAINT FK_Trabajos_Profesional FOREIGN KEY (profesional_id) REFERENCES dbo.Usuarios(id),
        CONSTRAINT FK_Trabajos_Servicio   FOREIGN KEY (servicio_id)    REFERENCES dbo.Servicios(id),
        CONSTRAINT CK_Trabajos_estado     CHECK (estado IN (
            'pendiente', 'aceptado', 'viajando', 'en_progreso', 'completado', 'cancelado'
        )),
        CONSTRAINT CK_Trabajos_tipo_pago  CHECK (tipo_pago IN ('efectivo', 'tarjeta', 'transferencia'))
    );
END
GO

-- ============================================================
-- POSTULACIONES (profesional se postula a un trabajo)
-- ============================================================
IF OBJECT_ID(N'dbo.Postulaciones', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.Postulaciones (
        id              INT IDENTITY(1,1)   NOT NULL,
        trabajo_id      INT                 NOT NULL,
        profesional_id  INT                 NOT NULL,
        presupuesto     DECIMAL(10,2)       NULL,
        creado_en       DATETIME2           NOT NULL DEFAULT SYSUTCDATETIME(),

        CONSTRAINT PK_Postulaciones               PRIMARY KEY CLUSTERED (id),
        CONSTRAINT FK_Postulaciones_Trabajo       FOREIGN KEY (trabajo_id)     REFERENCES dbo.Trabajos(id) ON DELETE CASCADE,
        CONSTRAINT FK_Postulaciones_Profesional   FOREIGN KEY (profesional_id) REFERENCES dbo.Usuarios(id),
        CONSTRAINT UQ_Postulaciones_trabajo_prof  UNIQUE (trabajo_id, profesional_id)
    );
END
GO

-- ============================================================
-- PAGOS / TRANSACCIONES
-- Registro contable de cada pago asociado a un trabajo.
-- Cuando el pago es en efectivo, se registra el cobro completo
-- y se genera automaticamente la comision como deuda (via el ledger).
-- ============================================================
IF OBJECT_ID(N'dbo.Pagos', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.Pagos (
        id              INT IDENTITY(1,1)   NOT NULL,
        trabajo_id      INT                 NOT NULL,
        monto_total     DECIMAL(10,2)       NOT NULL,
        comision        DECIMAL(10,2)       NOT NULL,   -- 15% del monto total
        tipo_pago       NVARCHAR(20)        NOT NULL,
        estado          NVARCHAR(20)        NOT NULL DEFAULT 'registrado',
        creado_en       DATETIME2           NOT NULL DEFAULT SYSUTCDATETIME(),

        CONSTRAINT PK_Pagos           PRIMARY KEY CLUSTERED (id),
        CONSTRAINT FK_Pagos_Trabajo   FOREIGN KEY (trabajo_id) REFERENCES dbo.Trabajos(id),
        CONSTRAINT CK_Pagos_tipo_pago CHECK (tipo_pago IN ('efectivo', 'tarjeta', 'transferencia')),
        CONSTRAINT CK_Pagos_estado    CHECK (estado IN ('registrado', 'conciliado', 'reembolsado'))
    );
END
GO

-- ============================================================
-- CUENTA CORRIENTE / LEDGER
-- Auditoria de saldos de profesionales.
-- Cada entrada tiene un monto (+ ingreso, - egreso) y el
-- saldo posterior. El saldo del profesional se calcula como
-- SUM(monto) agrupado por profesional_id.
--
-- Logica de negocio:
--   - Trabajo completado EN EFECTIVO:
--       Se inserta un registro con monto = -(monto_total * 0.15)
--       y tipo = 'comision_adeudada'.
--       El saldo del profesional se vuelve negativo (deuda).
--   - El profesional paga su deuda:
--       Se inserta un registro con monto = +X y tipo = 'pago_deuda'.
--       El saldo se acerca a 0.
-- ============================================================
IF OBJECT_ID(N'dbo.CuentaCorriente', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.CuentaCorriente (
        id              INT IDENTITY(1,1)   NOT NULL,
        profesional_id  INT                 NOT NULL,
        trabajo_id      INT                 NULL,
        tipo            NVARCHAR(30)        NOT NULL,
        monto           DECIMAL(10,2)       NOT NULL,
        saldo_posterior DECIMAL(10,2)       NOT NULL,
        referencia      NVARCHAR(500)       NULL,
        creado_en       DATETIME2           NOT NULL DEFAULT SYSUTCDATETIME(),

        CONSTRAINT PK_CuentaCorriente          PRIMARY KEY CLUSTERED (id),
        CONSTRAINT FK_CC_Profesional           FOREIGN KEY (profesional_id) REFERENCES dbo.Usuarios(id),
        CONSTRAINT FK_CC_Trabajo               FOREIGN KEY (trabajo_id)     REFERENCES dbo.Trabajos(id),
        CONSTRAINT CK_CC_tipo                  CHECK (tipo IN (
            'comision_adeudada', 'pago_deuda', 'ajuste_manual'
        ))
    );
END
GO

-- ============================================================
-- RESEÑAS / REVIEWS
-- Cliente califica al profesional al finalizar el trabajo.
-- ============================================================
IF OBJECT_ID(N'dbo.Resenias', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.Resenias (
        id              INT IDENTITY(1,1)   NOT NULL,
        trabajo_id      INT                 NOT NULL,
        cliente_id      INT                 NOT NULL,
        profesional_id  INT                 NOT NULL,
        puntuacion      TINYINT             NOT NULL,
        comentario      NVARCHAR(1000)      NULL,
        creado_en       DATETIME2           NOT NULL DEFAULT SYSUTCDATETIME(),

        CONSTRAINT PK_Resenias            PRIMARY KEY CLUSTERED (id),
        CONSTRAINT FK_Resenias_Trabajo    FOREIGN KEY (trabajo_id)     REFERENCES dbo.Trabajos(id),
        CONSTRAINT FK_Resenias_Cliente    FOREIGN KEY (cliente_id)     REFERENCES dbo.Usuarios(id),
        CONSTRAINT FK_Resenias_Profesional FOREIGN KEY (profesional_id) REFERENCES dbo.Usuarios(id),
        CONSTRAINT UQ_Resenias_trabajo    UNIQUE (trabajo_id),
        CONSTRAINT CK_Resenias_puntuacion CHECK (puntuacion BETWEEN 1 AND 5)
    );
END
GO

-- ============================================================
-- CATÁLOGO BASE DE SERVICIOS
-- ============================================================
IF NOT EXISTS (SELECT 1 FROM dbo.Servicios)
BEGIN
    INSERT INTO dbo.Servicios (nombre, descripcion) VALUES
        ('Gasista',        'Instalacion, reparacion y mantenimiento de artefactos a gas'),
        ('Electricista',   'Instalaciones electricas, reparaciones y certificaciones'),
        ('Plomero',        'Reparacion de canerias, termotanques y sanitarios'),
        ('Pintor',         'Pintura interior y exterior, enduido y revestimientos'),
        ('Cerrajero',      'Apertura de puertas, cambio de cerraduras y copias de llaves'),
        ('Carpintero',     'Muebles a medida, reparacion de aberturas y colocacion'),
        ('Albanil',        'Arreglos de paredes, contrapisos y revoques'),
        ('Techista',       'Reparacion de techos, filtraciones y membranas'),
        ('Jardinero',      'Corte de cesped, poda, diseno de jardines'),
        ('Servicio Tecnico', 'Reparacion de electrodomesticos y equipos electronicos');
END
GO

-- ============================================================
-- ÍNDICES PARA RENDIMIENTO
-- ============================================================

-- Búsqueda de profesionales por servicio
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_ProfesionalServicios_servicio')
    CREATE NONCLUSTERED INDEX IX_ProfesionalServicios_servicio
        ON dbo.ProfesionalServicios (servicio_id)
        INCLUDE (profesional_id);
GO

-- Listar trabajos por cliente (dashboard)
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Trabajos_cliente')
    CREATE NONCLUSTERED INDEX IX_Trabajos_cliente
        ON dbo.Trabajos (cliente_id, estado)
        INCLUDE (profesional_id, servicio_id, creado_en);
GO

-- Listar trabajos por profesional (dashboard)
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Trabajos_profesional')
    CREATE NONCLUSTERED INDEX IX_Trabajos_profesional
        ON dbo.Trabajos (profesional_id, estado)
        INCLUDE (cliente_id, servicio_id, creado_en);
GO

-- Buscar trabajos pendientes por ubicación (geolocalización)
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Trabajos_pendientes_geo')
    CREATE NONCLUSTERED INDEX IX_Trabajos_pendientes_geo
        ON dbo.Trabajos (estado, latitud_destino, longitud_destino)
        WHERE estado IN ('pendiente', 'aceptado');
GO

-- Ledger por profesional (consultas de saldo)
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_CuentaCorriente_profesional')
    CREATE NONCLUSTERED INDEX IX_CuentaCorriente_profesional
        ON dbo.CuentaCorriente (profesional_id, creado_en DESC)
        INCLUDE (monto, saldo_posterior, tipo);
GO

-- Búsqueda de reseñas por profesional
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Resenias_profesional')
    CREATE NONCLUSTERED INDEX IX_Resenias_profesional
        ON dbo.Resenias (profesional_id, puntuacion)
        INCLUDE (cliente_id, creado_en);
GO

PRINT 'Base de datos MarketplaceServicios inicializada correctamente.';
GO
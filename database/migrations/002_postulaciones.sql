-- ============================================================
-- Migration 002: Postulaciones table
-- Run this if you already have the database from initial script
-- ============================================================

USE MarketplaceServicios;
GO

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
    PRINT 'Tabla Postulaciones creada.';
END
ELSE
    PRINT 'Tabla Postulaciones ya existe.';
GO

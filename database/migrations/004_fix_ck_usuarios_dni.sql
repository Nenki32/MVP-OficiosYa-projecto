USE MarketplaceServicios;
GO

IF EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = 'CK_Usuarios_dni')
BEGIN
    ALTER TABLE dbo.Usuarios DROP CONSTRAINT CK_Usuarios_dni;
    PRINT 'CK_Usuarios_dni eliminado.';
END

ALTER TABLE dbo.Usuarios
    ADD CONSTRAINT CK_Usuarios_dni CHECK (
        (rol = 'profesional' AND dni IS NOT NULL)
        OR (rol IN ('cliente', 'admin'))
    );
PRINT 'CK_Usuarios_dni recreado - permite DNI opcional en clientes.';
GO

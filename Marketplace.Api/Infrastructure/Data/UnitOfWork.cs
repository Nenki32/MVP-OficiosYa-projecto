using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;
using Marketplace.Api.Core.Interfaces;

namespace Marketplace.Api.Infrastructure.Data;

public class UnitOfWork : IUnitOfWork
{
    private readonly AppDbContext _db;

    public UnitOfWork(AppDbContext db) => _db = db;

    public async Task ExecuteInTransactionAsync(Func<Task> operacion)
    {
        // Si ya hay una transaccion abierta (llamada anidada), no abrimos otra.
        if (_db.Database.CurrentTransaction != null)
        {
            await operacion();
            return;
        }

        // La execution strategy es la que reintenta ante fallos transitorios.
        // Con reintentos activados, EF exige que la transaccion viva adentro de ella.
        var strategy = _db.Database.CreateExecutionStrategy();

        await strategy.ExecuteAsync(async () =>
        {
            await using var tx = await _db.Database.BeginTransactionAsync();
            await operacion();
            await tx.CommitAsync();
        });
    }
}

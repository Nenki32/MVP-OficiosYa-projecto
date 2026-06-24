using Microsoft.EntityFrameworkCore;
using Marketplace.Api.Data;
using Marketplace.Api.DTOs.CuentaCorriente;
using Marketplace.Api.Models;

namespace Marketplace.Api.Services;

public class CuentaCorrienteService : ICuentaCorrienteService
{
    private readonly AppDbContext _db;

    public CuentaCorrienteService(AppDbContext db)
    {
        _db = db;
    }

    public async Task<SaldoResponse> ObtenerSaldoAsync(int profesionalId)
    {
        var ultimoSaldo = await _db.CuentaCorriente
            .Where(cc => cc.ProfesionalId == profesionalId)
            .OrderByDescending(cc => cc.CreadoEn)
            .Select(cc => (decimal?)cc.SaldoPosterior)
            .FirstOrDefaultAsync();

        return new SaldoResponse { SaldoActual = ultimoSaldo ?? 0 };
    }

    public async Task<List<CuentaCorrienteResponse>> ObtenerMovimientosAsync(int profesionalId)
    {
        return await _db.CuentaCorriente
            .Where(cc => cc.ProfesionalId == profesionalId)
            .OrderByDescending(cc => cc.CreadoEn)
            .Select(cc => new CuentaCorrienteResponse
            {
                Id = cc.Id,
                Tipo = cc.Tipo,
                Monto = cc.Monto,
                SaldoPosterior = cc.SaldoPosterior,
                Referencia = cc.Referencia,
                TrabajoId = cc.TrabajoId,
                CreadoEn = cc.CreadoEn
            })
            .ToListAsync();
    }

    public async Task<CuentaCorrienteResponse> PagarDeudaAsync(int profesionalId, decimal monto)
    {
        if (monto <= 0)
            throw new InvalidOperationException("El monto debe ser positivo.");

        var saldoActual = (await ObtenerSaldoAsync(profesionalId)).SaldoActual;

        if (saldoActual >= 0)
            throw new InvalidOperationException("No tenes deuda pendiente.");

        if (monto > Math.Abs(saldoActual))
            throw new InvalidOperationException("El pago excede la deuda actual.");

        var nuevoSaldo = saldoActual + monto;

        var entry = new CuentaCorriente
        {
            ProfesionalId = profesionalId,
            Tipo = "pago_deuda",
            Monto = monto,
            SaldoPosterior = nuevoSaldo,
            Referencia = $"Pago de deuda - $ {monto:N2}"
        };

        _db.CuentaCorriente.Add(entry);
        await _db.SaveChangesAsync();

        return new CuentaCorrienteResponse
        {
            Id = entry.Id,
            Tipo = entry.Tipo,
            Monto = entry.Monto,
            SaldoPosterior = entry.SaldoPosterior,
            Referencia = entry.Referencia,
            CreadoEn = entry.CreadoEn
        };
    }
}

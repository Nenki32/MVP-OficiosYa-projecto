using Marketplace.Api.DTOs.CuentaCorriente;

namespace Marketplace.Api.Services;

public interface ICuentaCorrienteService
{
    Task<SaldoResponse> ObtenerSaldoAsync(int profesionalId);
    Task<List<CuentaCorrienteResponse>> ObtenerMovimientosAsync(int profesionalId);
    Task<CuentaCorrienteResponse> PagarDeudaAsync(int profesionalId, decimal monto);
}

using Marketplace.Api.Delivery.DTOs.CuentaCorriente;

namespace Marketplace.Api.Core.Interfaces;

public interface ICuentaCorrienteService
{
    Task<SaldoResponse> ObtenerSaldoAsync(int profesionalId);
    Task<List<CuentaCorrienteResponse>> ObtenerMovimientosAsync(int profesionalId);
    Task<CuentaCorrienteResponse> PagarDeudaAsync(int profesionalId, decimal monto);
}

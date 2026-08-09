using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Marketplace.Api.Core.Interfaces;
using Marketplace.Api.Delivery.DTOs.CuentaCorriente;

namespace Marketplace.Api.Delivery.Controllers;

[ApiController]
[Route("api/cuenta-corriente")]
[Authorize(Roles = "profesional")]
public class CuentaCorrienteController : ControllerBase
{
    private readonly ICuentaCorrienteService _service;

    public CuentaCorrienteController(ICuentaCorrienteService service) => _service = service;

    private int UserId => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    [HttpGet("saldo")]
    public async Task<IActionResult> Saldo()
    {
        var saldo = await _service.ObtenerSaldoAsync(UserId);
        return Ok(saldo);
    }

    [HttpGet("movimientos")]
    public async Task<IActionResult> Movimientos()
    {
        var movimientos = await _service.ObtenerMovimientosAsync(UserId);
        return Ok(movimientos);
    }

    [HttpPost("pagar")]
    public async Task<IActionResult> Pagar([FromBody] PagarDeudaRequest request)
    {
        try
        {
            var response = await _service.PagarDeudaAsync(UserId, request.Monto);
            return Ok(response);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }
}

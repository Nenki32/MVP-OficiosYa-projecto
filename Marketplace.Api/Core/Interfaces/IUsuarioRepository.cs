using Marketplace.Api.Core.Models;

namespace Marketplace.Api.Core.Interfaces;

public interface IUsuarioRepository
{
    Task<Usuario?> GetByIdAsync(int id);
    Task<Usuario?> GetByEmailAsync(string email);
    Task<bool> ExistsByEmailAsync(string email);
    Task AddAsync(Usuario usuario);
    Task UpdateAsync(Usuario usuario);
    Task<List<Usuario>> GetAllAsync();

    /// <summary>Trae el usuario con los rubros en los que trabaja.</summary>
    Task<Usuario?> GetConServiciosAsync(int id);

    /// <summary>
    /// Deja al profesional con exactamente los rubros indicados: agrega los que
    /// faltan y saca los que sobran, en una sola operacion.
    /// </summary>
    Task ReemplazarServiciosAsync(int profesionalId, IEnumerable<int> servicioIds);

    /// <summary>Ids de rubros que existen en el catalogo, de los indicados.</summary>
    Task<List<int>> FiltrarServiciosExistentesAsync(IEnumerable<int> servicioIds);
}

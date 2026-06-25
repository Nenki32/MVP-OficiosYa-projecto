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
}

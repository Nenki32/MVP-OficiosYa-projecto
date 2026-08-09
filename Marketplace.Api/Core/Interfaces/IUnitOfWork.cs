namespace Marketplace.Api.Core.Interfaces;

/// <summary>
/// Permite agrupar varias escrituras de repositorios en una sola transaccion.
/// Necesario porque cada repositorio hace su propio SaveChanges: sin esto, una
/// operacion que escribe en dos tablas puede quedar a medias si la segunda falla.
/// </summary>
public interface IUnitOfWork
{
    Task ExecuteInTransactionAsync(Func<Task> operacion);
}

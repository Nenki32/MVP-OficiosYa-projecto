namespace Marketplace.Api.Core.Models;

/// <summary>
/// Tipo de perfil de un usuario. Es ortogonal al rol: un cliente o un
/// profesional pueden ser tanto una persona fisica como una empresa.
/// </summary>
public static class TiposPerfil
{
    public const string Persona = "persona";
    public const string Empresa = "empresa";

    public static readonly string[] Todos = [Persona, Empresa];

    public static bool EsValido(string? valor) =>
        valor is not null && Todos.Contains(valor);
}

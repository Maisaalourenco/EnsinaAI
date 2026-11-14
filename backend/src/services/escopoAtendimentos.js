
export function aplicarEscopoAtendimentos(consulta, usuario) {
  if (usuario?.papel === "gestor") {
    return consulta;
  }

  if (
    usuario?.papel === "atendente" &&
    typeof usuario.id === "string" &&
    usuario.id.length > 0
  ) {
    return consulta.eq("atendente_id", usuario.id);
  }

  throw new Error("Perfil sem autorização para consultar atendimentos.");
}

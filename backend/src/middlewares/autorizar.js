
export function permitirPapeis(...papeisPermitidos) {
  return (req, res, next) => {

    // Verificar se o usuário foi autenticado
    if (!req.usuario) {
      return res.status(401).json({
        sucesso: false,
        mensagem: "Usuário não autenticado."
      });
    }

    // Verificar se possui o papel necessário
    if (!papeisPermitidos.includes(req.usuario.papel)) {
      return res.status(403).json({
        sucesso: false,
        mensagem: "Você não tem permissão para acessar este recurso."
      });
    }

    // Autorizar a continuação
    next();
  };
}

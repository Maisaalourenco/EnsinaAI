
import {
  createHash,
  timingSafeEqual
} from "node:crypto";

function gerarHash(valor) {
  return createHash("sha256")
    .update(valor, "utf8")
    .digest();
}

export function autenticarIntegracao(req, res, next) {
  const tokenEsperado =
    process.env.N8N_INTEGRATION_TOKEN;

  // Bloqueia o acesso caso o servidor
  // esteja sem uma credencial segura.
  if (
    typeof tokenEsperado !== "string" ||
    tokenEsperado.length < 32
  ) {
    return res.status(503).json({
      sucesso: false,
      mensagem: "Integração indisponível."
    });
  }

  const tokenRecebido =
    req.get("x-integracao-token");

  if (
    typeof tokenRecebido !== "string" ||
    !tokenRecebido
  ) {
    return res.status(401).json({
      sucesso: false,
      mensagem: "Integração não autorizada."
    });
  }

  const autorizado = timingSafeEqual(
    gerarHash(tokenRecebido),
    gerarHash(tokenEsperado)
  );

  if (!autorizado) {
    return res.status(401).json({
      sucesso: false,
      mensagem: "Integração não autorizada."
    });
  }

  next();
}


import app from '../backend/src/server.js';

export default function handler(req, res) {
  const rota = req.query?.route;

  const caminho = Array.isArray(rota)
    ? rota.join('/')
    : rota;

  if (
    typeof caminho !== 'string' ||
    !/^[a-zA-Z0-9/_-]+$/.test(caminho)
  ) {
    return res.status(404).json({
      sucesso: false,
      mensagem: 'Rota não encontrada.'
    });
  }

  const url = new URL(
    req.url || '/',
    'http://localhost'
  );

  url.searchParams.delete('route');

  // Restaura o endereço esperado pelo Express.
  req.url = `/api/${caminho}${url.search}`;

  return app(req, res);
}

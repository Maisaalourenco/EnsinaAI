
import { Router } from "express";

import {
  autenticarIntegracao
} from "../middlewares/autenticarIntegracao.js";

import {
  normalizarMensagemIntegracao
} from "../services/normalizarMensagemIntegracao.js";

const router = Router();

router.post(
  "/mensagens",
  autenticarIntegracao,
  (req, res) => {
    const mensagem = normalizarMensagemIntegracao(
      req.body
    );

    if (!mensagem) {
      return res.status(400).json({
        sucesso: false,
        mensagem: "Dados da integração inválidos."
      });
    }

    return res.status(200).json({
      sucesso: true,
      mensagem: "Evento validado. Armazenamento ainda não implementado.",
      canal: mensagem.canal,
      evento_id: mensagem.evento_id
    });
  }
);

export default router;

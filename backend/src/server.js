

import express from "express";
import cors from "cors";
import "dotenv/config";

// Criando o servidor
const app = express();

// Porta do servidor
const PORT = process.env.PORT || 3001;

// Configurações
app.use(cors());
app.use(express.json());

// Primeira rota da nossa API
app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "online",
    projeto: "Ensina Aí",
    mensagem: "Back-end funcionando!"
  });
});

app.get("/", (req, res) => {
  res.send("Bem-vindo à API do Ensina Aí!");
});

app.post("/api/leads", (req, res) => {
  // Recebendo os dados enviados pelo formulário
  const {
    nome_responsavel,
    etapa_codigo,
    turno_codigo,
    telefone,
    email
  } = req.body ?? {};

  // Validando os campos obrigatórios
  if (
    !nome_responsavel ||
    !etapa_codigo ||
    !turno_codigo ||
    !telefone ||
    !email
  ) {
    return res.status(400).json({
      sucesso: false,
      mensagem: "Preencha todos os campos obrigatórios."
    });
  }

  // Simulando um cadastro recebido
  const lead = {
    nome_responsavel,
    etapa_codigo,
    turno_codigo,
    telefone,
    email,
    canal: "site",
    recebido_em: new Date().toISOString()
  };

  console.log("Lead recebido:", lead);

  // Respondendo à landing page
  return res.status(201).json({
    sucesso: true,
    mensagem: "Dados recebidos com sucesso!",
    lead
  });
});

// Inicializando o servidor
app.listen(PORT, () => {
  console.log(
    `Servidor iniciado em http://localhost:${PORT}`
  );
});



import express from "express";
import cors from "cors";
import "dotenv/config";
import { supabaseAdmin } from "./config/supabase.js";
import { rateLimit } from "express-rate-limit";
import { autenticar } from "./middlewares/auth.js";

// Criando o servidor
const app = express();

// Porta do servidor
const PORT = process.env.PORT || 3001;

// Configurações

app.use(cors({
  origin: [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:5500",
    "http://127.0.0.1:5500"
  ]
}));

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


const limitarCadastros = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  message: {
    sucesso: false,
    mensagem: "Muitas tentativas. Tente novamente mais tarde."
  }
});

app.post("/api/leads", limitarCadastros, async (req, res) => {
  try {
    // 1. Receber os dados enviados
    const {
      nome_responsavel,
      etapa_codigo,
      turno_codigo,
      telefone,
      email,
      consentimento_contato
    } = req.body ?? {};

    // 2. Normalizar os dados
    const nome = typeof nome_responsavel === "string"
      ? nome_responsavel.trim()
      : "";

    const etapa = typeof etapa_codigo === "string"
      ? etapa_codigo.trim()
      : "";

    const turno = typeof turno_codigo === "string"
      ? turno_codigo.trim()
      : "";

    const whatsapp = typeof telefone === "string"
      ? telefone.replace(/\D/g, "")
      : "";

    const emailLimpo = typeof email === "string"
      ? email.trim().toLowerCase()
      : "";

    // 3. Validar os campos obrigatórios
    if (
      nome.length < 3 ||
      nome.length > 120 ||
      !/^[a-z][a-z0-9_]*$/.test(etapa) ||
      !/^[a-z][a-z0-9_]*$/.test(turno) ||
      !/^\d{10,13}$/.test(whatsapp) ||
      emailLimpo.length > 160 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailLimpo)
    ) {
      return res.status(400).json({
        sucesso: false,
        mensagem: "Dados do formulário inválidos."
      });
    }

    if (consentimento_contato !== true) {
      return res.status(400).json({
        sucesso: false,
        mensagem: "Confirme a autorização de contato."
      });
    }

    // 4. Consultar os códigos no Supabase V2
    const [
      { data: serie, error: erroSerie },
      { data: turnoDb, error: erroTurno }
    ] = await Promise.all([
      supabaseAdmin
        .from("series_escolares")
        .select("id")
        .eq("codigo", etapa)
        .eq("ativo", true)
        .maybeSingle(),

      supabaseAdmin
        .from("turnos")
        .select("id")
        .eq("codigo", turno)
        .eq("ativo", true)
        .maybeSingle()
    ]);

    if (erroSerie || erroTurno) {
      console.error("Erro ao consultar catálogo:", {
        serie: erroSerie?.code,
        turno: erroTurno?.code
      });

      return res.status(502).json({
        sucesso: false,
        mensagem: "Erro ao consultar as opções escolares."
      });
    }

    if (!serie || !turnoDb) {
      return res.status(422).json({
        sucesso: false,
        mensagem: "Série ou turno indisponível no momento."
      });
    }

    // 5. Inserir o lead no banco de dados
    const { data: lead, error } = await supabaseAdmin
      .from("leads")
      .insert({
        nome_responsavel: nome,
        telefone: whatsapp,
        email: emailLimpo,
        serie_interesse_id: serie.id,
        turno_interesse_id: turnoDb.id,
        canal: "site",
        consentimento_contato: true,
        consentimento_em: new Date().toISOString()
      })
      .select("id")
      .single();

    if (error) {
      console.error("Erro ao cadastrar lead:", error.code);

      return res.status(500).json({
        sucesso: false,
        mensagem: "Não foi possível realizar o cadastro."
      });
    }

    // 6. Confirmar o cadastro
    return res.status(201).json({
      sucesso: true,
      mensagem: "Interesse em matrícula registrado!",
      lead_id: lead.id
    });

  } catch (erro) {
    console.error("Erro interno:", erro.message);

    return res.status(500).json({
      sucesso: false,
      mensagem: "Erro interno do servidor."
    });
  }
});


app.get("/api/catalogo", async (req, res) => {
  try {
    // Consultar etapas escolares ativas
    const { data: series, error: erroSeries } =
      await supabaseAdmin
        .from("series_escolares")
        .select("codigo, nome, nivel")
        .eq("ativo", true)
        .order("ordem");

    // Consultar turnos ativos
    const { data: turnos, error: erroTurnos } =
      await supabaseAdmin
        .from("turnos")
        .select("codigo, nome")
        .eq("ativo", true)
        .order("id");

    // Verificar erros de banco
    if (erroSeries || erroTurnos) {
      console.error(
        "Erro na consulta:",
        erroSeries?.message || erroTurnos?.message
      );

      return res.status(502).json({
        sucesso: false,
        mensagem: "Erro ao consultar o catálogo."
      });
    }

    // Enviar resposta ao navegador
    return res.status(200).json({
      sucesso: true,
      series: series,
      turnos: turnos
    });

  } catch (erro) {
    console.error("Erro interno:", erro.message);

    return res.status(500).json({
      sucesso: false,
      mensagem: "Erro interno do servidor."
    });
  }
});


app.get("/api/me", autenticar, (req, res) => {
  return res.status(200).json({
    sucesso: true,
    usuario: req.usuario
  });
});

// Inicializando o servidor
app.listen(PORT, () => {
  console.log(
    `Servidor iniciado em http://localhost:${PORT}`
  );
});

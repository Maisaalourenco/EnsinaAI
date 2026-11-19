
(function (window) {
  'use strict';

  async function render(container) {
    container.innerHTML = `
      <section class="crm-leads-module">
        <section class="crm-leads-header-bar">
          <div>
            <h2>Leads reais — Ensina Aí</h2>
            <p class="crm-leads-subtitle">
              Dados do Supabase Staging, conforme seu perfil.
            </p>
          </div>
          <button class="btn btn-primary"
            id="atualizar-leads-reais">
            Atualizar
          </button>
        </section>

        <p id="status-leads-reais" role="status">
          Carregando leads...
        </p>

        <div class="crm-table-scroll">
          <table class="crm-table">
            <thead>
              <tr>
                <th>Responsável</th>
                <th>Aluno</th>
                <th>WhatsApp</th>
                <th>E-mail</th>
                <th>Cadastro</th>
              </tr>
            </thead>
            <tbody id="tabela-leads-reais"></tbody>
          </table>
        </div>
      </section>
    `;

    const tbody = container.querySelector(
      '#tabela-leads-reais'
    );
    const status = container.querySelector(
      '#status-leads-reais'
    );

    async function carregar() {
      status.textContent = 'Carregando leads...';
      tbody.replaceChildren();

      try {
        const auth = window.EnsinaAiCrmAuth;
        const { data, error } =
          await auth.client.auth.getSession();

        if (error || !data.session) {
          throw new Error('Sessão não encontrada.');
        }

        // Local: Node.js na porta 3001.
        // Vercel: mesma origem do frontend.
        const local = ['localhost', '127.0.0.1']
          .includes(window.location.hostname);

        const base = local
          ? 'http://localhost:3001'
          : '';

        const resposta = await fetch(
          `${base}/api/leads`,
          {
            headers: {
              Authorization:
                `Bearer ${data.session.access_token}`
            },
            cache: 'no-store'
          }
        );

        const resultado = await resposta.json();

        if (!resposta.ok || !resultado.sucesso) {
          throw new Error(
            resultado.mensagem || 'Erro ao buscar leads.'
          );
        }

        const leads = resultado.leads || [];

        for (const lead of leads) {
          const tr = document.createElement('tr');

          const dataCadastro = lead.criado_em
            ? new Date(lead.criado_em)
                .toLocaleDateString('pt-BR')
            : '—';

          const valores = [
            lead.nome_responsavel,
            lead.nome_aluno,
            lead.telefone,
            lead.email,
            dataCadastro
          ];

          for (const valor of valores) {
            const td = document.createElement('td');
            td.textContent = valor || '—';
            tr.appendChild(td);
          }

          tbody.appendChild(tr);
        }

        status.textContent =
          `${leads.length} lead(s) encontrado(s).`;

      } catch (erro) {
        status.textContent =
          `Não foi possível carregar os leads: ${erro.message}`;
      }
    }

    container.querySelector(
      '#atualizar-leads-reais'
    ).addEventListener('click', carregar);

    await carregar();
  }

  window.EnsinaAiRealLeads = { render };
})(window);

/**
 * ENSINA AÍ - Instituição de Ensino
 * Lógica de Interface e Validação do Formulário de Interesse em Matrícula (js/form.js)
 * JavaScript Vanilla (ES6+) - Independente da implementação de back-end via EnsinaAiLeadGateway
 */

document.addEventListener('DOMContentLoaded', () => {
  initEnrollmentForm();
});

function initEnrollmentForm() {
  const form = document.getElementById('enrollment-form');
  const successBanner = document.getElementById('form-success-banner');
  const resetBtn = document.getElementById('btn-reset-form');
  const submitErrorBox = document.getElementById('form-submit-error');
  const protocolBox = document.getElementById('success-protocol-box');
  const protocolCodeEl = document.getElementById('success-protocol-code');
  const devMockNoticeEl = document.getElementById('success-dev-mock-notice');
  const messageCounterEl = document.getElementById('parent-message-counter');
  const honeypotInput = document.getElementById('contact-website');

  if (!form) return;

  const appConfig = window.ENSINA_AI_CONFIG || {};
  const PRIVACY_NOTICE_VERSION = appConfig.privacyNoticeVersion || 'v1-2026-11';
  const SUBMIT_COOLDOWN_MS = Number(appConfig.submitCooldownMs) > 0 ? Number(appConfig.submitCooldownMs) : 8000;
  const MAX_MESSAGE_LENGTH = 500;

  let isSubmitting = false;
  let lastSubmitAt = 0;

  function normalizeBrazilianPhoneDigits(rawValue) {
    let digits = String(rawValue || '').replace(/\D/g, '');

    if (digits.startsWith('0055') && digits.length >= 14) {
      digits = digits.slice(4);
    } else if (digits.startsWith('55') && (digits.length === 12 || digits.length === 13)) {
      digits = digits.slice(2);
    } else if (digits.startsWith('0') && (digits.length === 11 || digits.length === 12)) {
      digits = digits.slice(1);
    }

    if (digits.length > 11) {
      digits = digits.slice(0, 11);
    }

    return digits;
  }

  function formatBrazilianPhone(digits) {
    if (!digits) return '';
    if (digits.length > 10) {
      return digits.replace(/^(\d{2})(\d{5})(\d{0,4})$/, '($1) $2-$3');
    }
    if (digits.length > 6) {
      return digits.replace(/^(\d{2})(\d{4})(\d{0,4})$/, '($1) $2-$3');
    }
    if (digits.length > 2) {
      return digits.replace(/^(\d{2})(\d{0,5})$/, '($1) $2');
    }
    return digits.replace(/^(\d*)$/, '($1');
  }

  function isValidBrazilianPhone(digits) {
    if (!/^\d{10,11}$/.test(digits)) return false;

    const ddd = Number.parseInt(digits.slice(0, 2), 10);
    if (ddd < 11 || ddd > 99 || ddd % 10 === 0) return false;

    const subscriber = digits.slice(2);
    if (/^(\d)\1+$/.test(subscriber)) return false;

    if (digits.length === 11 && subscriber[0] !== '9') return false;
    if (digits.length === 10 && !/^[2-9]/.test(subscriber[0])) return false;

    return true;
  }

  const fields = {
    name: {
      input: document.getElementById('parent-name'),
      error: document.getElementById('error-parent-name'),
      validate: (val) => {
        const trimmed = val.trim();
        if (!trimmed) return 'O nome do responsável é obrigatório.';
        if (trimmed.length < 3) return 'O nome deve conter ao menos 3 caracteres.';
        if (trimmed.length > 120) return 'O nome deve ter no máximo 120 caracteres.';
        if (!/^[A-Za-zÀ-ÖØ-öø-ÿ\s'-]+$/.test(trimmed)) {
          return 'O nome deve conter apenas letras, espaços, hífen ou apóstrofo.';
        }
        return '';
      }
    },
    studentName: {
      input: document.getElementById('student-name'),
      error: document.getElementById('error-student-name'),
      optional: true,
      validate: (val) => {
        const trimmed = val.trim();
        if (!trimmed) return '';
        if (trimmed.length < 2) return 'O nome do aluno(a) deve conter ao menos 2 caracteres.';
        if (trimmed.length > 120) return 'O nome do aluno(a) deve ter no máximo 120 caracteres.';
        if (!/^[A-Za-zÀ-ÖØ-öø-ÿ\s'-]+$/.test(trimmed)) {
          return 'O nome do aluno(a) deve conter apenas letras, espaços, hífen ou apóstrofo.';
        }
        return '';
      }
    },
    stage: {
      input: document.getElementById('student-stage'),
      error: document.getElementById('error-student-stage'),
      validate: (val) => {
        if (!val) return 'Selecione a série ou etapa de interesse.';
        return '';
      }
    },
    shift: {
      input: document.getElementById('school-shift'),
      error: document.getElementById('error-school-shift'),
      validate: (val) => {
        if (!val) return 'Selecione o turno desejado.';
        return '';
      }
    },
    whatsapp: {
      input: document.getElementById('parent-whatsapp'),
      error: document.getElementById('error-parent-whatsapp'),
      validate: (val) => {
        const digits = normalizeBrazilianPhoneDigits(val);
        if (!digits) return 'O número de WhatsApp é obrigatório.';
        if (digits.length < 10 || digits.length > 11) {
          return 'Informe um WhatsApp brasileiro válido com DDD (10 ou 11 dígitos).';
        }
        if (!isValidBrazilianPhone(digits)) {
          return 'Informe um DDD e número de WhatsApp brasileiro válido (ex.: (11) 98765-4321).';
        }
        return '';
      }
    },
    email: {
      input: document.getElementById('parent-email'),
      error: document.getElementById('error-parent-email'),
      validate: (val) => {
        const trimmed = val.trim();
        if (!trimmed) return 'O e-mail é obrigatório.';
        if (trimmed.length > 160) return 'O e-mail deve ter no máximo 160 caracteres.';
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        if (!emailRegex.test(trimmed)) {
          return 'Informe um endereço de e-mail válido (ex.: nome@dominio.com).';
        }
        return '';
      }
    },
    message: {
      input: document.getElementById('parent-message'),
      error: document.getElementById('error-parent-message'),
      optional: true,
      validate: (val) => {
        if (val.trim().length > MAX_MESSAGE_LENGTH) {
          return `A observação deve ter no máximo ${MAX_MESSAGE_LENGTH} caracteres.`;
        }
        return '';
      }
    },
    consent: {
      input: document.getElementById('lgpd-consent'),
      error: document.getElementById('error-lgpd-consent'),
      isCheckbox: true,
      validate: () => {
        const checkbox = fields.consent.input;
        if (!checkbox || !checkbox.checked) {
          return 'Marque a autorização de contato para enviar sua solicitação.';
        }
        return '';
      }
    }
  };

  function updateMessageCounter() {
    if (!fields.message.input || !messageCounterEl) return;
    const length = fields.message.input.value.length;
    messageCounterEl.textContent = `${length}/${MAX_MESSAGE_LENGTH} caracteres`;
  }

  // 1. Máscara Dinâmica de Telefone Brasileiro (suporta colagem com DDI +55)
  if (fields.whatsapp.input) {
    fields.whatsapp.input.addEventListener('input', (e) => {
      const digits = normalizeBrazilianPhoneDigits(e.target.value);
      e.target.value = formatBrazilianPhone(digits);
    });
  }

  if (fields.message.input) {
    updateMessageCounter();
    fields.message.input.addEventListener('input', updateMessageCounter);
  }

  // 2. Feedback Inline no Blur / Input / Change
  Object.keys(fields).forEach((key) => {
    const field = fields[key];
    if (!field.input) return;

    if (field.isCheckbox) {
      field.input.addEventListener('change', () => {
        validateSingleField(field);
        clearSubmitError();
      });
      return;
    }

    field.input.addEventListener('blur', () => {
      validateSingleField(field);
    });

    field.input.addEventListener('input', () => {
      clearSubmitError();
      if (field.input.classList.contains('is-invalid')) {
        validateSingleField(field);
      }
    });

    if (field.input.tagName === 'SELECT') {
      field.input.addEventListener('change', () => {
        clearSubmitError();
        validateSingleField(field);
      });
    }
  });

  function validateSingleField(field) {
    if (!field.input) return true;

    const rawValue = field.isCheckbox ? '' : field.input.value;
    const errorMsg = field.validate(rawValue);
    const visualTarget = field.isCheckbox
      ? field.input.closest('.form-checkbox-label')
      : field.input;

    if (errorMsg) {
      if (visualTarget) {
        visualTarget.classList.add('is-invalid');
        visualTarget.classList.remove('is-valid');
      }
      field.input.setAttribute('aria-invalid', 'true');
      if (field.error) {
        field.error.textContent = errorMsg;
        field.error.classList.add('show');
      }
      return false;
    }

    if (visualTarget) {
      visualTarget.classList.remove('is-invalid');
      if (!field.isCheckbox && rawValue.trim() !== '') {
        visualTarget.classList.add('is-valid');
      } else {
        visualTarget.classList.remove('is-valid');
      }
    }
    field.input.removeAttribute('aria-invalid');
    if (field.error) {
      field.error.textContent = '';
      field.error.classList.remove('show');
    }
    return true;
  }

  function showSubmitError(message) {
    if (!submitErrorBox) return;
    submitErrorBox.textContent = message;
    submitErrorBox.hidden = false;
  }

  function clearSubmitError() {
    if (!submitErrorBox) return;
    submitErrorBox.textContent = '';
    submitErrorBox.hidden = true;
  }

  function setLoadingState(loading) {
    const submitBtn = document.getElementById('btn-submit-enrollment');
    const submitText = document.getElementById('btn-submit-text');
    const submitSpinner = document.getElementById('btn-submit-spinner');
    const submitIcon = submitBtn ? submitBtn.querySelector('.icon') : null;

    form.setAttribute('aria-busy', loading ? 'true' : 'false');

    if (submitBtn) {
      submitBtn.disabled = loading;
      submitBtn.setAttribute('aria-disabled', loading ? 'true' : 'false');
    }
    if (submitSpinner) {
      submitSpinner.style.display = loading ? 'inline-block' : 'none';
    }
    if (submitIcon) {
      submitIcon.style.display = loading ? 'none' : '';
    }
    if (submitText) {
      submitText.textContent = loading
        ? 'Enviando solicitação...'
        : 'Manifestar Interesse em Matrícula';
    }

    Object.keys(fields).forEach((key) => {
      if (fields[key].input) {
        fields[key].input.disabled = loading;
      }
    });
  }

  // 3. Submissão via Camada de Interface Desacoplada
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearSubmitError();

    if (isSubmitting) return;

    let isFormValid = true;
    let firstInvalidInput = null;

    Object.keys(fields).forEach((key) => {
      const field = fields[key];
      const valid = validateSingleField(field);
      if (!valid) {
        isFormValid = false;
        if (!firstInvalidInput && field.input) {
          firstInvalidInput = field.input;
        }
      }
    });

    if (!isFormValid) {
      if (firstInvalidInput) {
        firstInvalidInput.focus();
      }
      return;
    }

    const now = Date.now();
    if (now - lastSubmitAt < SUBMIT_COOLDOWN_MS) {
      showSubmitError('Aguarde alguns segundos antes de enviar uma nova solicitação.');
      return;
    }

    const gateway = window.EnsinaAiLeadGateway;
    if (!gateway || typeof gateway.submitLead !== 'function') {
      showSubmitError(
        'O canal de envio está temporariamente indisponível. Seus dados foram mantidos; entre em contato pelo nosso WhatsApp ao lado.'
      );
      return;
    }

    const stageSelect = fields.stage.input;
    const shiftSelect = fields.shift.input;
    const normalizedPhoneDigits = normalizeBrazilianPhoneDigits(fields.whatsapp.input.value);
    fields.whatsapp.input.value = formatBrazilianPhone(normalizedPhoneDigits);

    const requestBody = {
      nome_responsavel: fields.name.input.value.trim(),
      nome_aluno: fields.studentName.input ? fields.studentName.input.value.trim() : '',
      etapa_codigo: stageSelect.value,
      turno_codigo: shiftSelect.value,
      telefone: normalizedPhoneDigits,
      email: fields.email.input.value.trim().toLowerCase(),
      mensagem_inicial: fields.message.input ? fields.message.input.value.trim() : '',
      consentimento_contato: Boolean(fields.consent.input && fields.consent.input.checked),
      versao_aviso_privacidade: PRIVACY_NOTICE_VERSION,
      website: honeypotInput ? honeypotInput.value.trim() : ''
    };

    const summaryView = {
      name: requestBody.nome_responsavel,
      studentName: requestBody.nome_aluno,
      stageLabel: stageSelect.options[stageSelect.selectedIndex]?.text || requestBody.etapa_codigo,
      shiftLabel: shiftSelect.options[shiftSelect.selectedIndex]?.text || requestBody.turno_codigo,
      whatsapp: fields.whatsapp.input.value.trim(),
      email: requestBody.email,
      message: requestBody.mensagem_inicial
    };

    isSubmitting = true;
    setLoadingState(true);

    try {
      const result = await gateway.submitLead(requestBody);

      if (!result || !result.ok) {
        showSubmitError(
          (result && result.message) ||
            'Não foi possível concluir o envio agora. Seus dados foram mantidos; tente novamente ou utilize o WhatsApp ao lado.'
        );
        return;
      }

      lastSubmitAt = Date.now();

      if (devMockNoticeEl) {
        devMockNoticeEl.hidden = !result.isMock;
      }

      if (protocolBox && protocolCodeEl) {
        if (result.protocol) {
          protocolCodeEl.textContent = result.protocol;
          protocolBox.hidden = false;
        } else {
          protocolCodeEl.textContent = '';
          protocolBox.hidden = true;
        }
      }

      const summaryList = document.getElementById('success-summary-data');
      if (summaryList) {
        const items = [
          `<li><strong>Responsável:</strong> ${escapeHtml(summaryView.name)}</li>`
        ];
        if (summaryView.studentName) {
          items.push(`<li><strong>Aluno(a):</strong> ${escapeHtml(summaryView.studentName)}</li>`);
        }
        items.push(
          `<li><strong>Etapa / Série:</strong> ${escapeHtml(summaryView.stageLabel)}</li>`,
          `<li><strong>Turno:</strong> ${escapeHtml(summaryView.shiftLabel)}</li>`,
          `<li><strong>WhatsApp:</strong> ${escapeHtml(summaryView.whatsapp)}</li>`,
          `<li><strong>E-mail:</strong> ${escapeHtml(summaryView.email)}</li>`
        );
        if (summaryView.message) {
          items.push(`<li><strong>Observação:</strong> ${escapeHtml(summaryView.message)}</li>`);
        }
        summaryList.innerHTML = items.join('');
      }

      form.style.display = 'none';
      if (successBanner) {
        successBanner.classList.add('is-visible');
        successBanner.focus();
      }
    } finally {
      isSubmitting = false;
      setLoadingState(false);
    }
  });

  // 4. Reinicialização do Formulário para Nova Solicitação
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      form.reset();
      clearSubmitError();
      updateMessageCounter();

      Object.keys(fields).forEach((key) => {
        const field = fields[key];
        if (!field.input) return;
        field.input.disabled = false;
        field.input.removeAttribute('aria-invalid');
        const visualTarget = field.isCheckbox
          ? field.input.closest('.form-checkbox-label')
          : field.input;
        if (visualTarget) {
          visualTarget.classList.remove('is-valid', 'is-invalid');
        }
        if (field.error) {
          field.error.textContent = '';
          field.error.classList.remove('show');
        }
      });

      if (devMockNoticeEl) devMockNoticeEl.hidden = true;
      if (protocolCodeEl) protocolCodeEl.textContent = '';
      if (protocolBox) protocolBox.hidden = true;
      if (successBanner) {
        successBanner.classList.remove('is-visible');
      }
      form.style.display = 'block';

      if (fields.name.input) {
        fields.name.input.focus();
      }
    });
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}

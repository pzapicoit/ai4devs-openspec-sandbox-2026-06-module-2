'use strict';

// Dominios desechables conocidos
const DISPOSABLE_DOMAINS = new Set([
  'mailinator.com', 'tempmail.com', 'guerrillamail.com', 'throwaway.email',
  'yopmail.com', 'sharklasers.com', 'guerrillamailblock.com', 'grr.la',
  'guerrillamail.info', 'spam4.me', 'trashmail.com', 'trashmail.me',
  'dispostable.com', 'maildrop.cc', 'fakeinbox.com', 'mailnull.com',
  'spamgourmet.com', 'spamgourmet.net', 'spamgourmet.org', 'getairmail.com',
  'filzmail.com', '10minutemail.com', 'tempr.email', 'discard.email',
  'spamthisplease.com', 'getnada.com', 'moakt.com', 'burnermail.io',
]);

// Regex robusto basado en RFC 5321/5322
const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$/;

// Caracteres homoglyphs comunes usados para engañar
const HOMOGLYPH_PATTERN = /[àáâãäåæçèéêëìíîïðñòóôõöøùúûüýþÿ]/i;

/**
 * Valida un email y detecta señales de fraude.
 * @param {string} email
 * @returns {{ valid: boolean, fraudulent: boolean, reasons: string[] }}
 */
function validateEmail(email) {
  const reasons = [];

  if (typeof email !== 'string' || email.trim() === '') {
    return { valid: false, fraudulent: false, reasons: ['El email está vacío o no es una cadena de texto'] };
  }

  const normalized = email.trim().toLowerCase();

  // ── 1. Validación de formato ──────────────────────────────────────────────
  if (!EMAIL_REGEX.test(normalized)) {
    return { valid: false, fraudulent: false, reasons: ['Formato de email inválido'] };
  }

  const [localPart, domain] = normalized.split('@');

  // ── 2. Detección de fraude ────────────────────────────────────────────────

  // Local-part demasiado largo (RFC 5321 máximo 64 caracteres)
  if (localPart.length > 64) {
    reasons.push('Local-part supera los 64 caracteres (RFC 5321)');
  }

  // Múltiples signos "+" en el local-part
  if ((localPart.match(/\+/g) || []).length > 1) {
    reasons.push('Múltiples signos "+" en el local-part, posible intento de elusión de filtros');
  }

  // Dominio desechable conocido
  if (DISPOSABLE_DOMAINS.has(domain)) {
    reasons.push(`Dominio desechable conocido: ${domain}`);
  }

  // Subdominios excesivos (más de 2 niveles de dominio)
  const domainParts = domain.split('.');
  if (domainParts.length > 3) {
    reasons.push(`Subdominios excesivos (${domainParts.length - 1} niveles), patrón inusual`);
  }

  // Guión al inicio o al final de cualquier segmento del dominio
  const hasBadHyphens = domainParts.some(part => part.startsWith('-') || part.endsWith('-'));
  if (hasBadHyphens) {
    reasons.push('Segmento del dominio empieza o termina con guión, violación de RFC 1035');
  }

  // Caracteres homoglyphs en el dominio
  if (HOMOGLYPH_PATTERN.test(domain)) {
    reasons.push('Caracteres homoglyphs detectados en el dominio, posible suplantación visual');
  }

  // Dígitos excesivos en el local-part (más del 70% son números)
  const digits = (localPart.match(/\d/g) || []).length;
  if (localPart.length > 5 && digits / localPart.length > 0.7) {
    reasons.push('Local-part compuesto mayoritariamente por dígitos, patrón de cuenta generada automáticamente');
  }

  // Dominio con guiones dobles seguidos (técnica de IDN homograph)
  if (domain.includes('--')) {
    reasons.push('Dominio contiene "--", posible ataque de homógrafo IDN');
  }

  // Local-part con puntos consecutivos
  if (localPart.includes('..')) {
    reasons.push('Local-part con puntos consecutivos, formato inválido según RFC 5322');
  }

  const fraudulent = reasons.length > 0;
  return { valid: true, fraudulent, reasons };
}

// ── Casos de prueba ───────────────────────────────────────────────────────────

const TEST_CASES = [
  // Emails válidos y legítimos
  { email: 'usuario@gmail.com',                expected: { valid: true,  fraudulent: false } },
  { email: 'nombre.apellido@empresa.es',       expected: { valid: true,  fraudulent: false } },
  { email: 'dev+tag@github.com',               expected: { valid: true,  fraudulent: false } },
  { email: 'contacto@universidad.edu.es',      expected: { valid: true,  fraudulent: false } },

  // Emails con formato inválido
  { email: 'sinArroba.com',                    expected: { valid: false, fraudulent: false } },
  { email: '@dominio.com',                     expected: { valid: false, fraudulent: false } },
  { email: 'usuario@',                         expected: { valid: false, fraudulent: false } },

  // Emails fraudulentos
  { email: 'test@mailinator.com',              expected: { valid: true,  fraudulent: true  } },
  { email: 'user@tempmail.com',                expected: { valid: true,  fraudulent: true  } },
  { email: 'a'.repeat(65) + '@gmail.com',      expected: { valid: true,  fraudulent: true  } },
  { email: 'user+tag+extra@gmail.com',         expected: { valid: true,  fraudulent: true  } },
  { email: 'victim@phishing.sub.sub.sub.com',  expected: { valid: true,  fraudulent: true  } },
  { email: '9283746501@gmail.com',             expected: { valid: true,  fraudulent: true  } },
  { email: 'spoof@xn--pypal-4ve.com',          expected: { valid: true,  fraudulent: true  } }, // IDN --
];

function runTests() {
  const PASS = '\x1b[32m✔ PASS\x1b[0m';
  const FAIL = '\x1b[31m✘ FAIL\x1b[0m';

  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('  VALIDADOR DE EMAILS — Casos de prueba');
  console.log('═══════════════════════════════════════════════════════════\n');

  let passed = 0;
  let failed = 0;

  for (const { email, expected } of TEST_CASES) {
    const result = validateEmail(email);
    const ok = result.valid === expected.valid && result.fraudulent === expected.fraudulent;

    const label = ok ? PASS : FAIL;
    const display = email.length > 45 ? email.slice(0, 42) + '...' : email;

    console.log(`${label}  ${display}`);
    console.log(`       valid=${result.valid} | fraudulent=${result.fraudulent}`);

    if (result.reasons.length > 0) {
      result.reasons.forEach(r => console.log(`       ⚠  ${r}`));
    }
    if (!ok) {
      console.log(`       ❌ Esperado: valid=${expected.valid}, fraudulent=${expected.fraudulent}`);
      failed++;
    } else {
      passed++;
    }
    console.log();
  }

  console.log('───────────────────────────────────────────────────────────');
  console.log(`  Resultado: ${passed} pasados, ${failed} fallidos de ${TEST_CASES.length} tests`);
  console.log('═══════════════════════════════════════════════════════════\n');
}

runTests();

module.exports = { validateEmail };

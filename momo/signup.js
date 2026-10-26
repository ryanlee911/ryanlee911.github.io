import { signupConfig } from './signup-config.js';

const WEB_APP = /^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec$/;
const GOOGLE_ORIGIN = /^https:\/\/(?:script\.google\.com|(?:[a-z0-9-]+\.)?script\.googleusercontent\.com|[a-z0-9-]+-script\.googleusercontent\.com)$/;
export const signupReady = () => WEB_APP.test(signupConfig.endpoint);

/**
 * POST via a hidden iframe, then wait for the Apps Script acknowledgement.
 * No no-cors/opaque response is interpreted as a successful spreadsheet write.
 * Personal values are sent in the POST body, never a URL or browser storage.
 */
export function submitSignup(fields, requestId) {
  if (!signupReady()) return Promise.reject(new Error('NOT_CONFIGURED'));
  return new Promise((resolve, reject) => {
    const nonce = crypto.randomUUID();
    const iframe = document.createElement('iframe');
    iframe.name = `momo-signup-${nonce}`;
    iframe.title = 'MOMO 참여 신청 결과 수신';
    iframe.hidden = true;
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = signupConfig.endpoint;
    form.target = iframe.name;
    form.hidden = true;
    const values = { ...fields, requestId, nonce, returnOrigin: location.origin };
    for (const [key, value] of Object.entries(values)) {
      const input = document.createElement('input');
      input.type = 'hidden'; input.name = key; input.value = String(value);
      form.append(input);
    }
    let settled = false;
    const cleanup = () => { clearTimeout(timer); window.removeEventListener('message', receive); form.remove(); iframe.remove(); };
    const finish = (error, response) => { if (settled) return; settled = true; cleanup(); error ? reject(error) : resolve(response); };
    function receive(event) {
      const result = event.data;
      if (!GOOGLE_ORIGIN.test(event.origin) || !result || result.type !== 'momo-signup-result' || result.requestId !== requestId || result.nonce !== nonce) return;
      if (result.ok === true) finish(null, { duplicate: result.duplicate === true });
      else finish(new Error(['INVALID_INPUT', 'BUSY', 'NOT_CONFIGURED'].includes(result.code) ? result.code : 'SERVER_ERROR'));
    }
    const timer = setTimeout(() => finish(new Error('TIMEOUT')), signupConfig.timeoutMs);
    window.addEventListener('message', receive);
    document.body.append(iframe, form);
    try { HTMLFormElement.prototype.submit.call(form); } catch { finish(new Error('NETWORK_ERROR')); }
  });
}

let context = {};
let pendingKey = '', pendingId = '', sending = false;

export function setSignupContext(next) {
  context = { ...next };
  const note = document.getElementById('signup-context');
  note.textContent = next.label || 'MOMO의 다음 순간을 함께 만들어주세요.';
}

export function initSignup() {
  const form = document.getElementById('signup-form');
  const status = document.getElementById('signup-status');
  const button = document.getElementById('signup-submit');
  const fields = document.getElementById('signup-fields');
  const success = document.getElementById('signup-success');
  if (!signupReady()) {
    status.textContent = '참여 신청은 곧 열릴 예정이에요. 지금은 화면을 먼저 둘러보세요.';
    button.textContent = '참여 신청 준비 중'; button.disabled = true;
  }
  form.addEventListener('input', () => { if (!sending && signupReady()) { status.textContent = ''; status.classList.remove('is-error'); } });
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (sending || !signupReady() || !form.reportValidity()) return;
    const data = new FormData(form);
    const payload = {
      email: String(data.get('email')).trim().toLowerCase(), age: data.get('age'), gender: data.get('gender'),
      consent: data.get('consent') === 'on' ? 'yes' : 'no', website: data.get('website') || '',
      entry: context.entry || 'landing', purpose: context.purpose || '', transport: context.transport || '',
      eventId: context.eventId || '', mateId: context.mateId || '',
    };
    const key = JSON.stringify(payload);
    if (key !== pendingKey) { pendingKey = key; pendingId = crypto.randomUUID(); }
    sending = true; fields.disabled = true; button.disabled = true; button.textContent = '신청 내용을 보내고 있어요…'; form.setAttribute('aria-busy', 'true');
    status.textContent = ''; status.classList.remove('is-error');
    try {
      const result = await submitSignup(payload, pendingId);
      fields.hidden = true; success.hidden = false;
      document.getElementById('signup-success-title').textContent = result.duplicate ? '이미 MOMO에 마음을 남겨주셨어요.' : '너의 moment, 잘 모아두었어요.';
      document.getElementById('signup-success-description').textContent = result.duplicate ? '같은 이메일로 남긴 신청을 확인했어요. 다시 제출하지 않아도 괜찮아요.' : 'MOMO 검증 참여 신청을 받았어요. 함께할 다음 순간에 만나요.';
      form.reset(); context = {}; pendingKey = ''; pendingId = '';
      success.focus();
    } catch (error) {
      const messages = {
        TIMEOUT: '신청 결과를 아직 확인하지 못했어요. 잠시 후 다시 눌러주세요. 같은 신청은 중복 저장하지 않아요.',
        INVALID_INPUT: '이메일·나이대·성별과 동의 항목을 다시 확인해주세요.',
        BUSY: '신청이 잠시 몰리고 있어요. 조금 뒤에 다시 시도해주세요.',
        NOT_CONFIGURED: '신청을 잠시 준비 중이에요. 조금 뒤에 다시 방문해주세요.',
      };
      status.textContent = messages[error.message] || '신청을 보내지 못했어요. 입력한 내용은 그대로 있으니 잠시 후 다시 시도해주세요.';
      status.classList.add('is-error'); status.focus();
    } finally {
      sending = false; fields.disabled = false; button.disabled = false; button.textContent = 'MOMO 검증에 참여할게요'; form.removeAttribute('aria-busy');
    }
  });
}

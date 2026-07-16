// ---------- helpers ----------
function arrayBufferToBase64(buf) {
  const bytes = new Uint8Array(buf);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}
function base64ToArrayBuffer(b64) {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}
function toPem(buffer, label) {
  const b64 = arrayBufferToBase64(buffer);
  const lines = b64.match(/.{1,64}/g).join('\n');
  return `-----BEGIN ${label}-----\n${lines}\n-----END ${label}-----`;
}
function pemToArrayBuffer(pem) {
  const b64 = pem.replace(/-----BEGIN [^-]+-----/, '').replace(/-----END [^-]+-----/, '').replace(/\s+/g, '');
  if (!b64) throw new Error('empty-key');
  return base64ToArrayBuffer(b64);
}

// ---------- crypto core ----------
async function generateKeyPair() {
  const keyPair = await crypto.subtle.generateKey(
    { name: 'RSA-OAEP', modulusLength: 2048, publicExponent: new Uint8Array([1,0,1]), hash: 'SHA-256' },
    true,
    ['encrypt', 'decrypt']
  );
  const spki = await crypto.subtle.exportKey('spki', keyPair.publicKey);
  const pkcs8 = await crypto.subtle.exportKey('pkcs8', keyPair.privateKey);
  return {
    publicKeyPem: toPem(spki, 'PUBLIC KEY'),
    privateKeyPem: toPem(pkcs8, 'PRIVATE KEY')
  };
}

async function importPublicKey(pem) {
  const buf = pemToArrayBuffer(pem);
  return crypto.subtle.importKey('spki', buf, { name: 'RSA-OAEP', hash: 'SHA-256' }, true, ['encrypt']);
}
async function importPrivateKey(pem) {
  const buf = pemToArrayBuffer(pem);
  return crypto.subtle.importKey('pkcs8', buf, { name: 'RSA-OAEP', hash: 'SHA-256' }, true, ['decrypt']);
}

// Hybrid encryption: AES-GCM encrypts the message, RSA-OAEP wraps the AES key.
// This lets messages of any length (Persian or English) be encrypted, not just
// the ~190 bytes RSA-OAEP alone could hold.
async function encryptMessage(publicKey, message) {
  const aesKey = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, ['encrypt']);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encodedMessage = new TextEncoder().encode(message);
  const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, aesKey, encodedMessage);
  const rawAesKey = await crypto.subtle.exportKey('raw', aesKey);
  const wrappedKey = await crypto.subtle.encrypt({ name: 'RSA-OAEP' }, publicKey, rawAesKey);

  const payload = {
    v: 1,
    key: arrayBufferToBase64(wrappedKey),
    iv: arrayBufferToBase64(iv.buffer),
    data: arrayBufferToBase64(ciphertext)
  };
  return btoa(unescape(encodeURIComponent(JSON.stringify(payload))));
}

async function decryptMessage(privateKey, blob) {
  const json = decodeURIComponent(escape(atob(blob.trim())));
  const payload = JSON.parse(json);
  const rawAesKey = await crypto.subtle.decrypt({ name: 'RSA-OAEP' }, privateKey, base64ToArrayBuffer(payload.key));
  const aesKey = await crypto.subtle.importKey('raw', rawAesKey, { name: 'AES-GCM' }, false, ['decrypt']);
  const iv = new Uint8Array(base64ToArrayBuffer(payload.iv));
  const plainBuf = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, aesKey, base64ToArrayBuffer(payload.data));
  return new TextDecoder().decode(plainBuf);
}

// ---------- UI wiring ----------
const genBtn = document.getElementById('genBtn');
const genIcon = document.getElementById('genIcon');
const genLabel = document.getElementById('genLabel');
const keyOutputs = document.getElementById('keyOutputs');
const keyWarning = document.getElementById('keyWarning');
const publicKeyArea = document.getElementById('publicKeyArea');
const privateKeyArea = document.getElementById('privateKeyArea');
const encPublicKey = document.getElementById('encPublicKey');
const decPrivateKey = document.getElementById('decPrivateKey');

genBtn.addEventListener('click', async () => {
  genIcon.classList.add('spinning');
  genLabel.textContent = 'در حال ساخت...';
  genBtn.disabled = true;
  try {
    const { publicKeyPem, privateKeyPem } = await generateKeyPair();
    publicKeyArea.value = publicKeyPem;
    privateKeyArea.value = privateKeyPem;
    encPublicKey.value = publicKeyPem;
    decPrivateKey.value = privateKeyPem;
    keyOutputs.classList.remove('hidden');
    keyOutputs.classList.add('fade-in');
    keyWarning.classList.remove('hidden');
  } catch (e) {
    alert('ساخت کلید با خطا مواجه شد: ' + e.message);
  } finally {
    genIcon.classList.remove('spinning');
    genLabel.textContent = 'ساخت کلید تازه';
    genBtn.disabled = false;
  }
});

document.getElementById('encryptBtn').addEventListener('click', async () => {
  const errEl = document.getElementById('encError');
  errEl.classList.add('hidden');
  const message = document.getElementById('plainMessage').value;
  const pemInput = encPublicKey.value.trim();

  if (!pemInput) { showError(errEl, 'اول یک کلید عمومی وارد کن یا بساز.'); return; }
  if (!message) { showError(errEl, 'یک پیام برای قفل‌کردن بنویس.'); return; }

  try {
    const publicKey = await importPublicKey(pemInput);
    const cipher = await encryptMessage(publicKey, message);
    document.getElementById('cipherOutput').value = cipher;
    const wrap = document.getElementById('cipherOutputWrap');
    wrap.classList.remove('hidden');
    wrap.classList.add('fade-in');
  } catch (e) {
    showError(errEl, 'کلید عمومی نامعتبر است یا در فرمت درستی نیست.');
  }
});

document.getElementById('decryptBtn').addEventListener('click', async () => {
  const errEl = document.getElementById('decError');
  errEl.classList.add('hidden');
  const pemInput = decPrivateKey.value.trim();
  const blob = document.getElementById('cipherInput').value.trim();

  if (!pemInput) { showError(errEl, 'اول کلید خصوصی را وارد کن.'); return; }
  if (!blob) { showError(errEl, 'متن رمزشده را وارد کن.'); return; }

  try {
    const privateKey = await importPrivateKey(pemInput);
    const plain = await decryptMessage(privateKey, blob);
    const outEl = document.getElementById('plainOutput');
    outEl.textContent = plain;
    const wrap = document.getElementById('plainOutputWrap');
    wrap.classList.remove('hidden');
    wrap.classList.add('fade-in');
  } catch (e) {
    showError(errEl, 'باز نشد. کلید خصوصی یا متن رمزشده اشتباه است.');
  }
});

function showError(el, msg) {
  el.textContent = msg;
  el.classList.remove('hidden');
}



// copy / download buttons (delegated)
document.addEventListener('click', async (e) => {
    const copyBtn = e.target.closest('.copy-btn');
    if (copyBtn) {
        const target = document.getElementById(copyBtn.dataset.copy);
        if (!target.value) return;
        await navigator.clipboard.writeText(target.value);
        const original = copyBtn.textContent;
        copyBtn.textContent = 'کپی شد!';
        setTimeout(() => copyBtn.textContent = original, 1200);
    }
    const pasteBtn = e.target.closest('.paste-btn');
    if (pasteBtn) {
        const target = document.getElementById(pasteBtn.dataset.paste);
        try {
        const text = await navigator.clipboard.readText();
        target.value = text;
        const original = pasteBtn.textContent;
        pasteBtn.textContent = 'چسبید!';
        setTimeout(() => pasteBtn.textContent = original, 1200);
        } catch (err) {
        alert('دسترسی به کلیپ‌بورد داده نشد. مرورگرت باید اجازه‌ی paste بده.');
        }
    }
      const dlBtn = e.target.closest('.dl-btn');
    if (dlBtn) {
        const target = document.getElementById(dlBtn.dataset.download);
        if (!target.value) return;
        const blob = new Blob([target.value], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = dlBtn.dataset.filename;
        a.click();
        URL.revokeObjectURL(url);
    }
});
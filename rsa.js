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



// ---------- UI wiring ----------
const genBtn = document.getElementById('genBtn');
const keyOutputs = document.getElementById('keyOutputs');
const keyWarning = document.getElementById('keyWarning');
const publicKeyArea = document.getElementById('publicKeyArea');
const privateKeyArea = document.getElementById('privateKeyArea');
const encPublicKey = document.getElementById('encPublicKey');
const decPrivateKey = document.getElementById('decPrivateKey');

genBtn.addEventListener('click', async () => {
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
        genLabel.textContent = 'ساخت کلید تازه';
    }
});

async function generateKeyPair() {
    const keyPair = await crypto.subtle.generateKey(
        { name: 'RSA-OAEP', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' },
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
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const storageDir = path.join(__dirname, '../storage');
fs.mkdirSync(storageDir, { recursive: true });

const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
  modulusLength: 2048,
  publicKeyEncoding: { type: 'spki', format: 'pem' },
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
});

fs.writeFileSync(path.join(storageDir, 'private.pem'), privateKey, { mode: 0o600 });
fs.writeFileSync(path.join(storageDir, 'public.pem'), publicKey);

console.log('RSA key pair generated:');
console.log('  storage/private.pem  (keep secret, never commit)');
console.log('  storage/public.pem   (safe to share with other services)');

import { Injectable } from '@nestjs/common';
import { Command } from 'nestjs-command';
import * as crypto from 'node:crypto';
import * as fs from 'node:fs';
import * as path from 'node:path';

@Injectable()
export class GenerateKeysCommand {
  @Command({
    command: 'keys:generate',
    describe: 'Generate RSA key pair for JWT signing',
  })
  run(): void {
    const storageDir = path.join(process.cwd(), 'storage');
    fs.mkdirSync(storageDir, { recursive: true });

    const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: { type: 'spki', format: 'pem' },
      privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
    });

    fs.writeFileSync(path.join(storageDir, 'private.pem'), privateKey, {
      mode: 0o600,
    });
    fs.writeFileSync(path.join(storageDir, 'public.pem'), publicKey);

    console.log('RSA key pair generated:');
    console.log('  storage/private.pem  (keep secret, never commit)');
    console.log('  storage/public.pem   (safe to share with other services)');
  }
}

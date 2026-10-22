import { ConfigService } from '@nestjs/config';
import { FieldEncryptionService } from '../src/crypto/field-encryption.service';
import {
  ActivityLogPayloadCryptoService,
  tokenizePlaintext,
} from '../src/activity-log/activity-log-payload-crypto.service';

describe('ActivityLogPayloadCryptoService', () => {
  const masterKey = Buffer.alloc(32, 7).toString('base64url');

  function createService(): ActivityLogPayloadCryptoService {
    const config = {
      get: (key: string) => (key === 'BIODATA_MASTER_KEY' ? masterKey : undefined),
    } as ConfigService;
    const fieldCrypto = new FieldEncryptionService(config);
    fieldCrypto.onModuleInit();
    const service = new ActivityLogPayloadCryptoService(fieldCrypto, config);
    service.onModuleInit();
    return service;
  }

  it('encrypts and decrypts payloads', () => {
    const service = createService();
    const { payloadEnc, searchTokens } = service.encryptPayload({
      title: 'Updated profile',
      linkPath: '/dashboard/profile',
      body: 'Name changed',
    });
    expect(String(payloadEnc._encrypted)).toMatch(/^enc:v1:/);
    expect(searchTokens.length).toBeGreaterThan(0);
    const decrypted = service.decryptPayload(payloadEnc);
    expect(decrypted?.title).toBe('Updated profile');
    expect(decrypted?.linkPath).toBe('/dashboard/profile');
  });

  it('builds stable blind tokens for queries', () => {
    const service = createService();
    const a = service.tokensForQuery('profile updated');
    const b = service.tokensForQuery('profile updated');
    expect(a).toEqual(b);
    expect(a.length).toBeGreaterThan(0);
  });

  it('tokenizePlaintext filters short tokens', () => {
    expect(tokenizePlaintext('a hi there')).toEqual(['hi', 'there']);
  });
});

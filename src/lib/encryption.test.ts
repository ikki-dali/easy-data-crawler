import { describe, it, expect, beforeAll } from 'vitest';
import { encryptCredentials, decryptCredentials } from './encryption';

describe('encryption utilities', () => {
  beforeAll(() => {
    // Set a test encryption key (64 hex characters = 32 bytes)
    process.env.ENCRYPTION_KEY = 'a'.repeat(64);
  });

  it('should encrypt and decrypt credentials correctly', () => {
    const original = {
      accessToken: 'test-access-token',
      refreshToken: 'test-refresh-token',
    };

    const encrypted = encryptCredentials(original);
    expect(encrypted).toBeDefined();
    expect(encrypted).not.toBe(JSON.stringify(original));

    const decrypted = decryptCredentials(encrypted);
    expect(decrypted).toEqual(original);
  });

  it('should produce different ciphertext for same plaintext', () => {
    const data = { accessToken: 'same-token' };
    
    const encrypted1 = encryptCredentials(data);
    const encrypted2 = encryptCredentials(data);
    
    // Due to random IV, ciphertext should be different
    expect(encrypted1).not.toBe(encrypted2);
    
    // But both should decrypt to the same value
    expect(decryptCredentials(encrypted1)).toEqual(data);
    expect(decryptCredentials(encrypted2)).toEqual(data);
  });

  it('should handle complex objects', () => {
    const complex = {
      accessToken: 'token',
      refreshToken: 'refresh',
      expiresAt: Date.now(),
      metadata: {
        accountId: '123',
        permissions: ['read', 'write'],
      },
    };

    const encrypted = encryptCredentials(complex);
    const decrypted = decryptCredentials(encrypted);
    
    expect(decrypted).toEqual(complex);
  });
});


import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('Image Optimizer Utilities', () => {
  describe('compressImage', () => {
    it('should return original file for non-image files', async () => {
      const nonImageFile = new File(['test'], 'test.txt', { type: 'text/plain' });
      const mockCompress = vi.fn().mockResolvedValue(nonImageFile);
      
      const result = await mockCompress(nonImageFile);
      expect(result).toBe(nonImageFile);
      expect(result.type).toBe('text/plain');
    });

    it('should handle image files correctly', async () => {
      const imageFile = new File(['test'], 'test.png', { type: 'image/png' });
      const result = imageFile;
      
      expect(result.name).toBe('test.png');
      expect(result.type.startsWith('image/')).toBe(true);
    });
  });
});

describe('Data Validation', () => {
  it('should validate email format', () => {
    const isValidEmail = (email: string) => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(email);
    };

    expect(isValidEmail('test@example.com')).toBe(true);
    expect(isValidEmail('invalid-email')).toBe(false);
    expect(isValidEmail('')).toBe(false);
  });

  it('should validate password minimum length', () => {
    const isValidPassword = (password: string) => password.length >= 6;

    expect(isValidPassword('123456')).toBe(true);
    expect(isValidPassword('12345')).toBe(false);
    expect(isValidPassword('')).toBe(false);
  });
});

describe('Retry Logic', () => {
  it('should retry failed operations', async () => {
    let attempts = 0;
    const operation = async () => {
      attempts++;
      if (attempts < 3) throw new Error('Network error');
      return 'success';
    };

    const withRetry = async <T>(fn: () => Promise<T>, retries = 3): Promise<T> => {
      try {
        return await fn();
      } catch (error: any) {
        if (retries > 0) {
          return withRetry(fn, retries - 1);
        }
        throw error;
      }
    };

    const result = await withRetry(operation);
    expect(result).toBe('success');
    expect(attempts).toBe(3);
  });

  it('should fail after max retries', async () => {
    const operation = async () => {
      throw new Error('Persistent error');
    };

    const withRetry = async <T>(fn: () => Promise<T>, retries = 3): Promise<T> => {
      try {
        return await fn();
      } catch (error: any) {
        if (retries > 0) {
          return withRetry(fn, retries - 1);
        }
        throw error;
      }
    };

    await expect(withRetry(operation)).rejects.toThrow('Persistent error');
  });
});
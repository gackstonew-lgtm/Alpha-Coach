/**
 * RFC 6238 Time-Based One-Time Password (TOTP) Service
 * Implemented using Node.js built-in crypto module (Zero external dependencies).
 * Compatible with Google Authenticator, Microsoft Authenticator, Authy, and 1Password.
 */

import crypto from 'crypto';

// Base32 alphabet according to RFC 4648
const BASE32_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

export class TotpService {
  /**
   * Generates a random Base32 encoded secret key (160 bits / 20 bytes).
   */
  public static generateSecret(byteLength: number = 20): string {
    const buffer = crypto.randomBytes(byteLength);
    let bits = '';
    for (let i = 0; i < buffer.length; i++) {
      bits += buffer[i].toString(2).padStart(8, '0');
    }
    let base32 = '';
    for (let i = 0; i + 5 <= bits.length; i += 5) {
      const chunk = bits.substring(i, i + 5);
      base32 += BASE32_CHARS[parseInt(chunk, 2)];
    }
    return base32;
  }

  /**
   * Decodes a Base32 string into a Buffer.
   */
  public static base32ToBuffer(base32: string): Buffer {
    const cleaned = base32.toUpperCase().replace(/=+$/, '').replace(/\s+/g, '');
    let bits = '';
    for (let i = 0; i < cleaned.length; i++) {
      const val = BASE32_CHARS.indexOf(cleaned[i]);
      if (val === -1) continue;
      bits += val.toString(2).padStart(5, '0');
    }
    const bytes: number[] = [];
    for (let i = 0; i + 8 <= bits.length; i += 8) {
      bytes.push(parseInt(bits.substring(i, i + 8), 2));
    }
    return Buffer.from(bytes);
  }

  /**
   * Generates the 6-digit TOTP code for a given time counter and secret.
   */
  public static generateToken(secret: string, timeStep: number = 30, offset: number = 0): string {
    const epoch = Math.floor(Date.now() / 1000);
    const counter = Math.floor(epoch / timeStep) + offset;
    const counterBuffer = Buffer.alloc(8);
    counterBuffer.writeBigInt64BE(BigInt(counter));

    const secretBuffer = this.base32ToBuffer(secret);
    const hmac = crypto.createHmac('sha1', secretBuffer);
    hmac.update(counterBuffer);
    const digest = hmac.digest();

    const offsetIndex = digest[digest.length - 1] & 0xf;
    const code =
      ((digest[offsetIndex] & 0x7f) << 24) |
      ((digest[offsetIndex + 1] & 0xff) << 16) |
      ((digest[offsetIndex + 2] & 0xff) << 8) |
      (digest[offsetIndex + 3] & 0xff);

    return (code % 1000000).toString().padStart(6, '0');
  }

  /**
   * Verifies a 6-digit TOTP code against a secret with a +/- 1 step window (60s drift tolerance).
   */
  public static verifyToken(token: string, secret: string): boolean {
    if (!token || token.trim().length !== 6) return false;
    const cleanToken = token.trim();

    // Check t-1, t, t+1
    for (const offset of [-1, 0, 1]) {
      const expected = this.generateToken(secret, 30, offset);
      if (crypto.timingSafeEqual(Buffer.from(cleanToken), Buffer.from(expected))) {
        return true;
      }
    }
    return false;
  }

  /**
   * Generates otpauth:// URI for QR code generators.
   */
  public static getOtpauthUri(secret: string, accountName: string, issuer: string = 'ArcadeFx'): string {
    const encodedIssuer = encodeURIComponent(issuer);
    const encodedAccount = encodeURIComponent(accountName);
    return `otpauth://totp/${encodedIssuer}:${encodedAccount}?secret=${secret}&issuer=${encodedIssuer}&algorithm=SHA1&digits=6&period=30`;
  }

  /**
   * Generates a set of single-use backup recovery codes.
   */
  public static generateBackupCodes(count: number = 8): { plainCodes: string[]; hashedCodes: string[] } {
    const plainCodes: string[] = [];
    const hashedCodes: string[] = [];

    for (let i = 0; i < count; i++) {
      const code = crypto.randomBytes(4).toString('hex').toUpperCase(); // 8-char hex code
      const formatted = `${code.slice(0, 4)}-${code.slice(4, 8)}`;
      plainCodes.push(formatted);
      const hash = crypto.createHash('sha256').update(formatted).digest('hex');
      hashedCodes.push(hash);
    }

    return { plainCodes, hashedCodes };
  }
}

export default TotpService;

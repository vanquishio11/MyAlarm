/**
 * Password hashing and verification. Never store plain text.
 * Uses salt + SHA-256. Compare with constant-time to reduce timing leaks.
 */

import * as Crypto from "expo-crypto";

const ENCODING = Crypto.CryptoEncoding.HEX;

/**
 * Hash a password with a new random salt.
 * @param {string} password - Plain password (will not be stored)
 * @returns {Promise<{ hash: string, salt: string }>}
 */
function bytesToHex(bytes) {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function hashPassword(password) {
  const saltBytes = await Crypto.getRandomBytesAsync(32);
  const salt = bytesToHex(saltBytes);
  const hash = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    salt + password,
    { encoding: ENCODING }
  );
  return { hash, salt };
}

/**
 * Verify user input against stored hash and salt.
 * @param {string} input - User-entered password
 * @param {string} storedHash - Stored hash (hex)
 * @param {string} salt - Stored salt (base64)
 * @returns {Promise<boolean>}
 */
export async function verifyPassword(input, storedHash, salt) {
  const computed = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    salt + input,
    { encoding: ENCODING }
  );
  return constantTimeCompare(computed, storedHash);
}

/**
 * Constant-time string compare to reduce timing attacks.
 * @param {string} a
 * @param {string} b
 * @returns {boolean}
 */
function constantTimeCompare(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

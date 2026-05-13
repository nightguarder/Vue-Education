/**
 * Simple encryption service using Web Crypto API (AES-GCM)
 * for protecting sensitive data in localStorage.
 */

const ENCRYPTION_KEY_NAME = 'v-edu-k'

async function getOrCreateKey(): Promise<CryptoKey> {
  const storedKey = localStorage.getItem(ENCRYPTION_KEY_NAME)
  if (storedKey) {
    const keyData = JSON.parse(storedKey)
    return await crypto.subtle.importKey(
      'jwk',
      keyData,
      { name: 'AES-GCM' },
      true,
      ['encrypt', 'decrypt']
    )
  }

  const key = await crypto.subtle.generateKey(
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  )
  const exported = await crypto.subtle.exportKey('jwk', key)
  localStorage.setItem(ENCRYPTION_KEY_NAME, JSON.stringify(exported))
  return key
}

export const encryption = {
  async encrypt(data: any): Promise<string> {
    try {
      const key = await getOrCreateKey()
      const iv = crypto.getRandomValues(new Uint8Array(12))
      const encoded = new TextEncoder().encode(JSON.stringify(data))
      
      const ciphertext = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        key,
        encoded
      )

      // Combine IV and Ciphertext for storage
      const combined = new Uint8Array(iv.length + ciphertext.byteLength)
      combined.set(iv)
      combined.set(new Uint8Array(ciphertext), iv.length)
      
      return btoa(String.fromCharCode(...combined))
    } catch (e) {
      console.error('Encryption failed:', e)
      return JSON.stringify(data) // Fallback to plain if fails (should not happen in modern browsers)
    }
  },

  async decrypt(encryptedStr: string): Promise<any> {
    try {
      if (!encryptedStr.endsWith('=') && !encryptedStr.match(/^[A-Za-z0-9+/]+$/)) {
        // Likely not encrypted or old data
        return JSON.parse(encryptedStr)
      }

      const key = await getOrCreateKey()
      const combined = new Uint8Array(
        atob(encryptedStr).split('').map(c => c.charCodeAt(0))
      )
      
      const iv = combined.slice(0, 12)
      const ciphertext = combined.slice(12)
      
      const decoded = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv },
        key,
        ciphertext
      )
      
      return JSON.parse(new TextDecoder().decode(decoded))
    } catch (e) {
      // If decryption fails, it might be old plain data
      try {
        return JSON.parse(encryptedStr)
      } catch {
        console.error('Decryption failed:', e)
        return null
      }
    }
  }
}

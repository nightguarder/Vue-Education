/**
 * Simple encryption service using Web Crypto API (AES-GCM)
 * for protecting sensitive data in localStorage.
 */

const ENCRYPTION_KEY_NAME = 'v-edu-k'
let cachedKey: CryptoKey | null = null

async function getOrCreateKey(): Promise<CryptoKey | null> {
  if (cachedKey) return cachedKey

  if (!crypto || !crypto.subtle) {
    console.warn('Crypto Subtle is not available. Data will not be encrypted.')
    return null
  }

  const storedKey = localStorage.getItem(ENCRYPTION_KEY_NAME)
  if (storedKey) {
    try {
      const keyData = JSON.parse(storedKey)
      cachedKey = await crypto.subtle.importKey(
        'jwk',
        keyData,
        { name: 'AES-GCM' },
        true,
        ['encrypt', 'decrypt']
      )
      return cachedKey
    } catch (e) {
      console.error('Failed to import existing key:', e)
    }
  }

  try {
    const key = await crypto.subtle.generateKey(
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt']
    )
    const exported = await crypto.subtle.exportKey('jwk', key)
    localStorage.setItem(ENCRYPTION_KEY_NAME, JSON.stringify(exported))
    cachedKey = key
    return key
  } catch (e) {
    console.error('Key generation failed:', e)
    return null
  }
}

export const encryption = {
  async encrypt(data: any): Promise<string> {
    try {
      const key = await getOrCreateKey()
      if (!key) return JSON.stringify(data)

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
      return JSON.stringify(data) 
    }
  },

  async decrypt(encryptedStr: string): Promise<any> {
    try {
      if (!encryptedStr || typeof encryptedStr !== 'string') return null

      const key = await getOrCreateKey()
      
      // If no key (non-secure context), assume data is plain JSON
      if (!key) return JSON.parse(encryptedStr)

      // Check if it's likely AES-GCM combined format
      const isBase64 = /^[A-Za-z0-9+/]*={0,2}$/.test(encryptedStr)
      if (!isBase64 || encryptedStr.length < 16) {
        try {
          return JSON.parse(encryptedStr)
        } catch {
          return null
        }
      }
      
      // ... rest of decryption logic
      
      // Safer decoding
      const binaryStr = atob(encryptedStr)
      const combined = new Uint8Array(binaryStr.length)
      for (let i = 0; i < binaryStr.length; i++) {
        combined[i] = binaryStr.charCodeAt(i)
      }
      
      if (combined.length < 13) throw new Error('Invalid encrypted format')

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
        // console.error('Decryption failed:', e)
        return null
      }
    }
  }
}

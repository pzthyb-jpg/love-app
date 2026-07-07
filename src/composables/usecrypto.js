// useCrypto.js — 安全哈希工具
// 用于密码等敏感数据的哈希存储（客户端侧）
// 使用 Web Crypto API 的 PBKDF2-SHA256 + 随机盐值(16字节) + 100,000 次迭代

const PBKDF2_ITERATIONS = 100000
const SALT_LENGTH = 16

// 盐值全局缓存（运行时）
let _cachedSalt = null

/**
 * 生成随机盐值（16字节）
 * @returns {Uint8Array} 随机盐值
 */
function generateSalt() {
  const salt = new Uint8Array(SALT_LENGTH)
  crypto.getRandomValues(salt)
  return salt
}

/**
 * 将 Uint8Array 转换为 Base64 字符串
 */
function arrayToBase64(buffer) {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
}

/**
 * 将 Base64 字符串转换为 Uint8Array
 */
function base64ToArray(base64) {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes
}

/**
 * 使用 PBKDF2-SHA256 对密码进行哈希
 * @param {string} password - 明文密码
 * @param {Uint8Array} [salt] - 可选盐值（不提供则生成新的）
 * @returns {Promise<{hash: string, salt: string}>} 哈希值和盐值（均为 Base64） */
async function hashPassword(password, salt) {
  if (!crypto.subtle) {
    throw new Error('SubtleCrypto API 不可用，无法安全哈希密码')
  }
  const encoder = new TextEncoder()
  const passwordData = encoder.encode(password)
  const useSalt = salt || generateSalt()

  // Import password as key material
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    passwordData,
    'PBKDF2',
    false,
    ['deriveBits']
  )

  // Derive bits using PBKDF2
  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: useSalt,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256'
    },
    keyMaterial,
    256
  )

  return {
    hash: arrayToBase64(derivedBits),
    salt: arrayToBase64(useSalt)
  }
}

/**
 * 验证密码是否匹配哈希
 * @param {string} password - 明文密码
 * @param {string} storedHash - 存储的哈希值（Base64）
 * @param {string} storedSalt - 存储的盐值（Base64）
 * @returns {Promise<boolean>} 是否匹配
 */
async function verifyPassword(password, storedHash, storedSalt) {
  if (!storedHash || !storedSalt) return false
  const salt = base64ToArray(storedSalt)
  const { hash } = await hashPassword(password, salt)
  return hash === storedHash
}

/**
 * 验证密码复杂度：6位以上，必须包含字母+数字
 * @param {string} password - 明文密码
 * @returns {{valid: boolean, message: string}} 验证结果
 */
function validatePasswordStrength(password) {
  if (!password || password.length < 6) {
    return { valid: false, message: '密码至少需要 6 位字符' }
  }
  const hasLetter = /[a-zA-Z]/.test(password)
  const hasDigit = /\d/.test(password)
  if (!hasLetter || !hasDigit) {
    return { valid: false, message: '密码必须包含字母和数字组合' }
  }
  return { valid: true, message: '' }
}

/**
 * 兼容旧格式检测：纯 SHA-256 哈希格式（64位十六进制）
 * 用于识别需要迁移的旧密码哈希
 */
function isLegacyHashFormat(str) {
  return typeof str === 'string' && /^[a-f0-9]{64}$/i.test(str)
}

export {
  hashPassword,
  verifyPassword,
  validatePasswordStrength,
  isLegacyHashFormat,
  generateSalt
}

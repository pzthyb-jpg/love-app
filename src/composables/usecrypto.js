// useCrypto.js — 安全哈希工具
// 用于密码等敏感数据的哈希存储（客户端侧）
// 使用 Web Crypto API 的 SHA-256

/**
 * 使用 SHA-256 对字符串进行哈希
 * @param {string} str - 要哈希的字符串
 * @returns {Promise<string>} 十六进制哈希值
 */
async function hashString(str) {
  const encoder = new TextEncoder()
  const data = encoder.encode(str)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  return hashHex
}

/**
 * 验证明文是否匹配哈希
 * @param {string} plaintext - 明文
 * @param {string} hash - 目标哈希值
 * @returns {Promise<boolean>} 是否匹配
 */
async function verifyHash(plaintext, hash) {
  if (!hash) return false
  const computedHash = await hashString(plaintext)
  return computedHash === hash
}

// 默认密码 '1314' 的预计算 SHA-256 哈希
// echo -n '1314' | shasum -a 256
const DEFAULT_PWD_HASH = '3324dab86f4dcdf48ba8ed6d736dcf050f09a23bf617c7d3579224548269ba1f'

/**
 * 判断字符串是否已经是 SHA-256 哈希格式（64位十六进制）
 */
function isHashFormat(str) {
  return typeof str === 'string' && /^[a-f0-9]{64}$/i.test(str)
}

export {
  hashString,
  verifyHash,
  DEFAULT_PWD_HASH,
  isHashFormat
}
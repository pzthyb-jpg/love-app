#!/usr/bin/env node
/**
 * UX Writing Linter for love-app
 * 检查 Vue 文件中的文案是否符合规范
 * 
 * 检查维度：
 * 1. 禁止词汇（技术术语、冷冰冰的表达）
 * 2. 语气检查（您、必须、不得等）
 * 3. 长度检查（Toast/按钮/标题/空状态）
 * 4. 情感化检查（Toast 应以 emoji 开头）
 * 
 * 用法：
 *   node scripts/ux-writing-lint.js
 *   node scripts/ux-writing-lint.js src/views/Home.vue
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// ==================== 配置 ====================
const CONFIG = {
  srcDir: path.join(__dirname, '..', 'src'),
  maxToastLength: 20,      // Toast 最大长度（不含 emoji）
  maxButtonLength: 6,      // 按钮最大长度
  maxTitleLength: 12,      // 弹窗标题最大长度
  maxBodyLength: 30,       // 弹窗正文最大长度
  maxEmptyStateLength: 20, // 空状态最大长度
};

// 禁止的词汇（技术术语、冷冰冰的表达）
const FORBIDDEN_WORDS = [
  { word: '操作成功', suggestion: '用更具体的表达，如「保存成功」「打卡成功」' },
  { word: '操作失败', suggestion: '用更具体的表达，如「保存失败」「网络错误」' },
  { word: '暂无数据', suggestion: '用空状态引导文案，如「还没有打卡记录哦」' },
  { word: '请稍后重试', suggestion: '用更温暖的表达，如「稍后再试试～」' },
  { word: '系统错误', suggestion: '用更友好的表达，如「出了点小问题」' },
  { word: '非法输入', suggestion: '用更友好的表达，如「输入内容不符合要求」' },
  { word: '确认提交', suggestion: '用动词开头，如「提交」「保存」' },
  { word: 'localStorage', suggestion: '对用户隐藏技术术语' },
  { word: 'sessionStorage', suggestion: '对用户隐藏技术术语' },
  { word: 'IndexedDB', suggestion: '对用户隐藏技术术语' },
  { word: 'API', suggestion: '对用户隐藏技术术语（用「接口」或具体名称）' },
  { word: 'HTTP', suggestion: '对用户隐藏技术术语' },
  { word: 'HTTPS', suggestion: '对用户隐藏技术术语' },
  { word: 'Token', suggestion: '对用户隐藏技术术语' },
  { word: '认证失败', suggestion: '用「密码错误」或「登录失败」' },
  { word: '权限不足', suggestion: '用「需要xxx权限」' },
  { word: '请求超时', suggestion: '用「网络有点慢，再试一次吧」' },
  { word: '服务器错误', suggestion: '用「出了点小问题，稍后再试」' },
  { word: '数据库', suggestion: '对用户隐藏技术术语' },
  { word: '缓存', suggestion: '对用户隐藏技术术语' },
];

// 语气检查规则
const TONE_RULES = [
  { pattern: /您/g, message: 'love-app 用「你」不用「您」（亲密关系，不是客服）' },
  { pattern: /请进行/g, message: '避免命令式语气，用更口语化的表达' },
  { pattern: /必须/g, message: '避免强制语气，用建议式表达' },
  { pattern: /不得/g, message: '避免否定式表达，用正面引导' },
  { pattern: /禁止/g, message: '避免否定式表达，用正面引导' },
  { pattern: /无法/g, message: '「无法」偏冷，考虑用「不能」或「打不开」' },
];

// 常见 emoji 范围（用于检测 emoji 开头）
const EMOJI_REGEX = /^[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{FE00}-\u{FE0F}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{200D}\u{20E3}\u{FE0F}\u{E0020}-\u{E007F}✨🎉😤💾📥📤🕐⏰❌✅🔑🗑️👧👦💌❤️🎂🎊🔥💖🌟⭐🌈🦋💗💓💘💝💞💟❣️💔💕💙💚💛🧡💜🖤🤍🤎💯💢💥💫💦💨🕳️💣💬👁️‍🗨️🗨️🗯️💭💤]+/u;

// ==================== 提取函数 ====================

/**
 * 从 Vue 文件中提取文案
 */
function extractTextFromVue(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const results = [];

  // 匹配 showToast 调用
  const toastRegex = /showToast\(\s*\{[^}]*message:\s*["'`]([^"'`]+)["'`]/g;
  let match;
  while ((match = toastRegex.exec(content)) !== null) {
    results.push({
      file: filePath,
      line: content.substring(0, match.index).split('\n').length,
      text: match[1],
      type: 'toast'
    });
  }

  // 匹配 placeholder
  const placeholderRegex = /placeholder=["'`]([^"'`]+)["'`]/g;
  while ((match = placeholderRegex.exec(content)) !== null) {
    results.push({
      file: filePath,
      line: content.substring(0, match.index).split('\n').length,
      text: match[1],
      type: 'placeholder'
    });
  }

  // 匹配 title 属性（van-tab 等）
  const titleRegex = /title=["'`]([^"'`]+)["'`]/g;
  while ((match = titleRegex.exec(content)) !== null) {
    results.push({
      file: filePath,
      line: content.substring(0, match.index).split('\n').length,
      text: match[1],
      type: 'title'
    });
  }

  // 匹配 dialog title
  const dialogTitleRegex = /title:\s*["'`]([^"'`]+)["'`]/g;
  while ((match = dialogTitleRegex.exec(content)) !== null) {
    results.push({
      file: filePath,
      line: content.substring(0, match.index).split('\n').length,
      text: match[1],
      type: 'dialog-title'
    });
  }

  // 匹配 dialog message
  const dialogMessageRegex = /message:\s*["'`]([^"'`]+)["'`]/g;
  while ((match = dialogMessageRegex.exec(content)) !== null) {
    // 排除 showToast 的 message（已单独处理）
    const beforeMatch = content.substring(Math.max(0, match.index - 50), match.index);
    if (!beforeMatch.includes('showToast')) {
      results.push({
        file: filePath,
        line: content.substring(0, match.index).split('\n').length,
        text: match[1],
        type: 'dialog-message'
      });
    }
  }

  // 匹配空状态文案（empty-state 相关）
  const emptyStateRegex = /class="[^"]*empty-state[^"]*"[^>]*>[\s\S]*?<p[^>]*>([^<]+)<\/p>/g;
  while ((match = emptyStateRegex.exec(content)) !== null) {
    const text = match[1].trim();
    if (text && /[\u4e00-\u9fa5]/.test(text)) {
      results.push({
        file: filePath,
        line: content.substring(0, match.index).split('\n').length,
        text: text,
        type: 'empty-state'
      });
    }
  }

  // 匹配按钮文字（van-button 内部文字）
  const buttonRegex = /<van-button[^>]*>([\s\S]*?)<\/van-button>/g;
  while ((match = buttonRegex.exec(content)) !== null) {
    const buttonContent = match[1].replace(/<[^>]+>/g, '').trim();
    // 过滤掉太长的（可能是变量）和包含模板表达式的
    if (buttonContent && buttonContent.length <= 20 && !buttonContent.includes('{{') && /[\u4e00-\u9fa5]/.test(buttonContent)) {
      results.push({
        file: filePath,
        line: content.substring(0, match.index).split('\n').length,
        text: buttonContent,
        type: 'button'
      });
    }
  }

  return results;
}

// ==================== 检查函数 ====================

/**
 * 检查单个文案
 */
function checkText(item) {
  const issues = [];
  const text = item.text;

  // 1. 检查禁止词汇
  for (const { word, suggestion } of FORBIDDEN_WORDS) {
    if (text.includes(word)) {
      issues.push({
        severity: 'error',
        type: 'forbidden-word',
        message: `包含禁止词汇「${word}」`,
        suggestion: suggestion,
      });
    }
  }

  // 2. 检查语气
  for (const { pattern, message } of TONE_RULES) {
    if (pattern.test(text)) {
      issues.push({
        severity: 'warning',
        type: 'tone',
        message: message,
      });
    }
  }

  // 3. 检查长度
  // 计算实际字符长度（排除 emoji）
  const textLength = text.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{FE00}-\u{FE0F}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u200D\u20E3\uFE0F\u{E0020}-\u{E007F}]/gu, '').length;
  
  if (item.type === 'toast' && textLength > CONFIG.maxToastLength) {
    issues.push({
      severity: 'warning',
      type: 'length',
      message: `Toast 文案过长（${textLength} 字，建议 ≤ ${CONFIG.maxToastLength} 字）`,
    });
  }
  if (item.type === 'button' && textLength > CONFIG.maxButtonLength) {
    issues.push({
      severity: 'warning',
      type: 'length',
      message: `按钮文案过长（${textLength} 字，建议 ≤ ${CONFIG.maxButtonLength} 字）`,
    });
  }
  if (item.type === 'dialog-title' && textLength > CONFIG.maxTitleLength) {
    issues.push({
      severity: 'warning',
      type: 'length',
      message: `弹窗标题过长（${textLength} 字，建议 ≤ ${CONFIG.maxTitleLength} 字）`,
    });
  }
  if (item.type === 'dialog-message' && textLength > CONFIG.maxBodyLength) {
    issues.push({
      severity: 'warning',
      type: 'length',
      message: `弹窗正文过长（${textLength} 字，建议 ≤ ${CONFIG.maxBodyLength} 字）`,
    });
  }
  if (item.type === 'empty-state' && textLength > CONFIG.maxEmptyStateLength) {
    issues.push({
      severity: 'warning',
      type: 'length',
      message: `空状态文案过长（${textLength} 字，建议 ≤ ${CONFIG.maxEmptyStateLength} 字）`,
    });
  }

  // 4. 检查 Toast 是否以 emoji 开头
  if (item.type === 'toast' && !EMOJI_REGEX.test(text)) {
    issues.push({
      severity: 'suggestion',
      type: 'emoji',
      message: 'Toast 文案建议以 emoji 开头，增加情感化',
    });
  }

  return issues;
}

// ==================== 主函数 ====================

function main() {
  // 获取要检查的文件列表
  let files = [];
  
  // 如果传入了参数，检查指定文件
  if (process.argv.length > 2) {
    files = process.argv.slice(2).filter(f => fs.existsSync(f));
  } else {
    // 默认检查 src 目录下所有 Vue 和 JS 文件
    try {
      files = execSync(`find ${CONFIG.srcDir} -name "*.vue" -o -name "*.js"`)
        .toString()
        .trim()
        .split('\n')
        .filter(f => f && !f.includes('node_modules') && fs.existsSync(f));
    } catch (e) {
      // Windows 兼容：使用 fs 遍历
      function walkDir(dir) {
        const results = [];
        const list = fs.readdirSync(dir);
        for (const file of list) {
          const fullPath = path.join(dir, file);
          const stat = fs.statSync(fullPath);
          if (stat.isDirectory() && !file.includes('node_modules')) {
            results.push(...walkDir(fullPath));
          } else if (file.endsWith('.vue') || file.endsWith('.js')) {
            results.push(fullPath);
          }
        }
        return results;
      }
      files = walkDir(CONFIG.srcDir);
    }
  }

  if (files.length === 0) {
    console.log('⚠️ 没有找到要检查的文件');
    process.exit(0);
  }

  let totalIssues = 0;
  const allIssues = [];

  for (const file of files) {
    try {
      const texts = extractTextFromVue(file);
      for (const item of texts) {
        const issues = checkText(item);
        for (const issue of issues) {
          totalIssues++;
          allIssues.push({
            ...issue,
            file: path.relative(process.cwd(), file),
            line: item.line,
            text: item.text,
          });
        }
      }
    } catch (e) {
      // 忽略读取错误
    }
  }

  // 输出结果
  if (totalIssues === 0) {
    console.log('✅ 文案检查通过，没有发现问题！');
    console.log(`   检查了 ${files.length} 个文件`);
    process.exit(0);
  }

  // 按严重程度排序
  const severityOrder = { error: 0, warning: 1, suggestion: 2 };
  allIssues.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

  console.log(`\n🔍 文案检查发现 ${totalIssues} 个问题（检查了 ${files.length} 个文件）：\n`);

  for (const issue of allIssues) {
    const icon = issue.severity === 'error' ? '❌' : issue.severity === 'warning' ? '⚠️' : '💡';
    console.log(`${icon} [${issue.severity.toUpperCase()}] ${issue.file}:${issue.line}`);
    console.log(`   文案: "${issue.text}"`);
    console.log(`   问题: ${issue.message}`);
    if (issue.suggestion) {
      console.log(`   建议: ${issue.suggestion}`);
    }
    console.log();
  }

  // 统计
  const errors = allIssues.filter(i => i.severity === 'error').length;
  const warnings = allIssues.filter(i => i.severity === 'warning').length;
  const suggestions = allIssues.filter(i => i.severity === 'suggestion').length;
  
  console.log(`📊 统计: ${errors} error, ${warnings} warning, ${suggestions} suggestion`);

  // 如果有 error，返回非零退出码
  process.exit(errors > 0 ? 1 : 0);
}

main();

#!/usr/bin/env node
/**
 * 文案一致性检查脚本 for love-app
 * 
 * 检查内容：
 * 1. 同一概念是否用同一称呼（同义词混用检测）
 * 2. Toast 结构是否统一（emoji + 主语 + 结果）
 * 3. 空状态结构是否统一
 * 4. 跨页面文案一致性
 * 
 * 用法：
 *   node scripts/check-text-consistency.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// ==================== 配置 ====================

// 同义词映射：标准词 → 同义词列表
const SYNONYM_MAP = {
  '打卡': ['签到', '记录', '打卡了'],
  '拍照': ['拍摄', '自拍', '照相', '咔嚓'],
  '愿望': ['心愿', '希望', '期望'],
  '吐槽': ['抱怨', '不满', '发泄'],
  '留言': ['消息', '便条', '纸条'],
  '转盘': ['轮盘', '旋转'],
  '餐厅': ['饭店', '饭馆', '美食', '吃饭'],
  '提醒': ['通知', '闹钟', '提示'],
  '导出': ['下载', '输出', 'backup'],
  '导入': ['上传', '恢复', '还原'],
  '删除': ['移除', '清除', '删掉'],
  '保存': ['存储', '确认', '提交'],
  '昵称': ['名字', '称呼', '姓名'],
  '密码': ['口令', '密钥', 'pin'],
  '成就': ['奖励', '荣誉', '勋章'],
  '连续打卡': ['连续签到', '持续打卡'],
  '纪念日': ['纪念日', '周年'],
};

// Toast 结构模板
const TOAST_STRUCTURES = {
  success: {
    pattern: /^[✨🎉✅💾📥📤🕐⏰👧👦🎂🎊🔥💖🌟]/,
    description: '成功类 Toast 应以庆祝 emoji 开头',
  },
  error: {
    pattern: /^[❌😢⚠️🔒💔]/,
    description: '错误类 Toast 应以警示 emoji 开头',
  },
  info: {
    pattern: /^[💡📋ℹ️]/,
    description: '信息类 Toast 应以信息 emoji 开头',
  },
};

// ==================== 提取函数 ====================

/**
 * 从 Vue 文件中提取所有 showToast 调用
 */
function extractToasts(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const toasts = [];
  const regex = /showToast\(\s*\{[^}]*message:\s*["'`]([^"'`]+)["'`]/g;
  let match;
  while ((match = regex.exec(content)) !== null) {
    toasts.push({
      text: match[1],
      line: content.substring(0, match.index).split('\n').length,
    });
  }
  return toasts;
}

/**
 * 从 Vue 文件中提取所有 dialog 相关文案
 */
function extractDialogs(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const dialogs = [];
  
  // showConfirmDialog 调用
  const confirmRegex = /showConfirmDialog\(\s*\{([^}]+)\}\)/g;
  let match;
  while ((match = confirmRegex.exec(content)) !== null) {
    const block = match[1];
    const titleMatch = block.match(/title:\s*["'`]([^"'`]+)["'`]/);
    const messageMatch = block.match(/message:\s*["'`]([^"'`]+)["'`]/);
    dialogs.push({
      title: titleMatch ? titleMatch[1] : '',
      message: messageMatch ? messageMatch[1] : '',
      line: content.substring(0, match.index).split('\n').length,
    });
  }
  
  return dialogs;
}

/**
 * 从 Vue 文件中提取空状态文案
 */
function extractEmptyStates(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const emptyStates = [];
  
  // 匹配 empty-state 类内的 p 标签
  const emptyRegex = /class="[^"]*empty-state[^"]*"[^>]*>[\s\S]*?<p[^>]*>([^<]+)<\/p>/g;
  let match;
  while ((match = emptyRegex.exec(content)) !== null) {
    const text = match[1].trim();
    if (text && /[\u4e00-\u9fa5]/.test(text)) {
      emptyStates.push({
        text: text,
        line: content.substring(0, match.index).split('\n').length,
      });
    }
  }
  
  return emptyStates;
}

// ==================== 检查函数 ====================

/**
 * 检查同义词混用
 */
function checkSynonymConsistency(files) {
  const issues = [];
  
  for (const [standard, synonyms] of Object.entries(SYNONYM_MAP)) {
    for (const syn of synonyms) {
      // 跳过标准词本身
      if (syn === standard) continue;
      
      for (const file of files) {
        const content = fs.readFileSync(file, 'utf-8');
        // 简单字符串匹配（实际应该用 AST 分析，但这里简化处理）
        if (content.includes(syn)) {
          // 排除注释中的提及
          const lines = content.split('\n');
          for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            if (line.includes(syn) && !line.trim().startsWith('//') && !line.trim().startsWith('*')) {
              issues.push({
                file: path.relative(process.cwd(), file),
                line: i + 1,
                issue: `使用了「${syn}」，建议统一为「${standard}」`,
                severity: 'warning',
              });
            }
          }
        }
      }
    }
  }
  
  return issues;
}

/**
 * 检查 Toast 结构一致性
 */
function checkToastStructure(allToasts) {
  const issues = [];
  
  for (const toast of allToasts) {
    const text = toast.text;
    
    // 检查是否以 emoji 开头
    const emojiRegex = /^[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{FE00}-\u{FE0F}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u200D\u20E3\uFE0F]/u;
    
    if (!emojiRegex.test(text)) {
      issues.push({
        file: toast.file,
        line: toast.line,
        issue: `Toast 未以 emoji 开头: "${text}"`,
        severity: 'suggestion',
      });
    }
    
    // 检查是否包含模板变量（如 ${name}）
    if (text.includes('${')) {
      // 模板变量是允许的，跳过
      continue;
    }
  }
  
  return issues;
}

/**
 * 检查空状态结构一致性
 */
function checkEmptyStateStructure(allEmptyStates) {
  const issues = [];
  
  for (const es of allEmptyStates) {
    const text = es.text;
    
    // 检查是否以 emoji 开头
    const emojiRegex = /^[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{FE00}-\u{FE0F}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u200D\u20E3\uFE0F]/u;
    
    if (!emojiRegex.test(text)) {
      issues.push({
        file: es.file,
        line: es.line,
        issue: `空状态未以 emoji 开头: "${text}"`,
        severity: 'suggestion',
      });
    }
  }
  
  return issues;
}

/**
 * 检查跨页面文案一致性
 * 重点检查：同一操作在不同页面的 Toast 是否一致
 */
function checkCrossPageConsistency(files) {
  const issues = [];
  
  // 收集所有 Toast
  const allToasts = [];
  for (const file of files) {
    const toasts = extractToasts(file);
    for (const t of toasts) {
      allToasts.push({ ...t, file });
    }
  }
  
  // 按文案内容分组
  const toastGroups = {};
  for (const t of allToasts) {
    // 提取核心文案（去掉 emoji 和变量）
    const core = t.text.replace(/^[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{FE00}-\u{FE0F}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u200D\u20E3\uFE0F]/gu, '').replace(/\$\{[^}]+\}/g, '').trim();
    if (core) {
      if (!toastGroups[core]) toastGroups[core] = [];
      toastGroups[core].push(t);
    }
  }
  
  // 检查是否有相似但不完全一致的文案
  const similarityChecks = [
    { variants: ['提醒已开启', '提醒已开启'], description: '提醒开关文案' },
    { variants: ['昵称已保存', '昵称已保存'], description: '昵称保存文案' },
    { variants: ['数据已导出', '数据已导出'], description: '导出文案' },
    { variants: ['数据已导入，请刷新页面', '数据已导入，请刷新页面'], description: '导入文案' },
  ];
  
  for (const check of similarityChecks) {
    const found = [];
    for (const variant of check.variants) {
      for (const t of allToasts) {
        if (t.text.includes(variant)) {
          found.push(t);
        }
      }
    }
    
    // 如果找到多个变体，检查是否一致
    if (found.length > 1) {
      const texts = [...new Set(found.map(f => f.text))];
      if (texts.length > 1) {
        issues.push({
          file: found.map(f => `${f.file}:${f.line}`).join(', '),
          issue: `${check.description}不一致: ${texts.map(t => `"${t}"`).join(' vs ')}`,
          severity: 'warning',
        });
      }
    }
  }
  
  return issues;
}

// ==================== 主函数 ====================

function main() {
  // 获取文件列表
  let files = [];
  try {
    files = execSync(`find src -name "*.vue" -o -name "*.js"`)
      .toString()
      .trim()
      .split('\n')
      .filter(f => f && !f.includes('node_modules') && fs.existsSync(f));
  } catch (e) {
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
    files = walkDir('src');
  }

  if (files.length === 0) {
    console.log('⚠️ 没有找到要检查的文件');
    process.exit(0);
  }

  let allIssues = [];
  
  // 1. 同义词一致性检查
  console.log('📝 检查同义词一致性...');
  const synonymIssues = checkSynonymConsistency(files);
  allIssues = allIssues.concat(synonymIssues);
  
  // 2. Toast 结构检查
  console.log('📱 检查 Toast 结构一致性...');
  const allToasts = [];
  for (const file of files) {
    const toasts = extractToasts(file);
    for (const t of toasts) {
      allToasts.push({ ...t, file: path.relative(process.cwd(), file) });
    }
  }
  const toastIssues = checkToastStructure(allToasts);
  allIssues = allIssues.concat(toastIssues);
  
  // 3. 空状态结构检查
  console.log('📭 检查空状态结构一致性...');
  const allEmptyStates = [];
  for (const file of files) {
    const ess = extractEmptyStates(file);
    for (const es of ess) {
      allEmptyStates.push({ ...es, file: path.relative(process.cwd(), file) });
    }
  }
  const emptyStateIssues = checkEmptyStateStructure(allEmptyStates);
  allIssues = allIssues.concat(emptyStateIssues);
  
  // 4. 跨页面一致性检查
  console.log('🔗 检查跨页面文案一致性...');
  const crossPageIssues = checkCrossPageConsistency(files);
  allIssues = allIssues.concat(crossPageIssues);
  
  // 输出结果
  const totalIssues = allIssues.length;
  
  if (totalIssues === 0) {
    console.log('\n✅ 文案一致性检查通过！');
    console.log(`   检查了 ${files.length} 个文件`);
    console.log(`   提取了 ${allToasts.length} 条 Toast, ${allEmptyStates.length} 条空状态`);
    process.exit(0);
  }
  
  // 按严重程度排序
  const severityOrder = { error: 0, warning: 1, suggestion: 2 };
  allIssues.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);
  
  console.log(`\n🔍 发现 ${totalIssues} 个一致性问题：\n`);
  
  for (const issue of allIssues) {
    const icon = issue.severity === 'error' ? '❌' : issue.severity === 'warning' ? '⚠️' : '💡';
    console.log(`${icon} [${issue.severity.toUpperCase()}] ${issue.file}${issue.line ? ':' + issue.line : ''}`);
    console.log(`   ${issue.issue}`);
    console.log();
  }
  
  // 统计
  const errors = allIssues.filter(i => i.severity === 'error').length;
  const warnings = allIssues.filter(i => i.severity === 'warning').length;
  const suggestions = allIssues.filter(i => i.severity === 'suggestion').length;
  
  console.log(`📊 统计: ${errors} error, ${warnings} warning, ${suggestions} suggestion`);
  
  process.exit(errors > 0 ? 1 : 0);
}

main();

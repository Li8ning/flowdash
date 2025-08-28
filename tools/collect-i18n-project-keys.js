const fs = require('fs');
const path = require('path');

// Regex patterns to match translation key usage
const TRANSLATION_PATTERNS = [
  // t('key'), t("key"), t(`key`)
  /\bt\s*\(\s*['"`]([^'"`]+)['"`]\s*\)/g,
  // i18n.t('key'), i18n.t("key"), i18n.t(`key`)
  /\bi18n\.t\s*\(\s*['"`]([^'"`]+)['"`]\s*\)/g,
  // useTranslation().t('key')
  /\.t\s*\(\s*['"`]([^'"`]+)['"`]\s*\)/g,
  // Trans component i18nKey prop
  /i18nKey\s*=\s*['"`]([^'"`]+)['"`]/g,
];

// File extensions to scan
const SCAN_EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx'];

// Directories to exclude from scanning
const EXCLUDE_DIRS = ['node_modules', '.git', '.next', 'dist', 'build', 'coverage', 'test-results', 'playwright-report'];

function flattenObject(obj, prefix = '') {
  const keys = [];
  if (typeof obj !== 'object' || obj === null) {
    return keys;
  }
  
  for (const [key, value] of Object.entries(obj)) {
    const newKey = prefix ? `${prefix}.${key}` : key;
    keys.push(newKey);
    
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      keys.push(...flattenObject(value, newKey));
    }
  }
  
  return keys;
}

function readJsonFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    console.warn(`Warning: Could not read/parse ${filePath}: ${error.message}`);
    return null;
  }
}

function extractKeysFromFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const keys = new Set();
    
    for (const pattern of TRANSLATION_PATTERNS) {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        if (match[1]) {
          keys.add(match[1]);
        }
      }
      // Reset regex lastIndex for global patterns
      pattern.lastIndex = 0;
    }
    
    return Array.from(keys);
  } catch (error) {
    console.warn(`Warning: Could not read ${filePath}: ${error.message}`);
    return [];
  }
}

function shouldScanFile(filePath) {
  const ext = path.extname(filePath);
  return SCAN_EXTENSIONS.includes(ext);
}

function shouldScanDirectory(dirPath) {
  const dirName = path.basename(dirPath);
  return !EXCLUDE_DIRS.includes(dirName) && !dirName.startsWith('.');
}

function scanDirectory(dirPath, baseDir = '') {
  const results = {};
  
  try {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      const relativePath = path.join(baseDir, entry.name);
      
      if (entry.isDirectory()) {
        if (shouldScanDirectory(fullPath)) {
          const subResults = scanDirectory(fullPath, relativePath);
          Object.assign(results, subResults);
        }
      } else if (entry.isFile() && shouldScanFile(fullPath)) {
        const keys = extractKeysFromFile(fullPath);
        if (keys.length > 0) {
          results[relativePath.replace(/\\/g, '/')] = keys;
        }
      }
    }
  } catch (error) {
    console.warn(`Warning: Could not scan directory ${dirPath}: ${error.message}`);
  }
  
  return results;
}

function loadLocaleKeys(localesDir) {
  const localeKeys = {};
  
  if (!fs.existsSync(localesDir)) {
    console.warn(`Locales directory not found: ${localesDir}`);
    return localeKeys;
  }
  
  try {
    const locales = fs.readdirSync(localesDir).filter(item => {
      const fullPath = path.join(localesDir, item);
      return fs.statSync(fullPath).isDirectory();
    });
    
    for (const locale of locales) {
      const localeDir = path.join(localesDir, locale);
      const localeKeysSet = new Set();
      
      const jsonFiles = fs.readdirSync(localeDir).filter(file => file.endsWith('.json'));
      
      for (const jsonFile of jsonFiles) {
        const filePath = path.join(localeDir, jsonFile);
        const data = readJsonFile(filePath);
        
        if (data) {
          const keys = flattenObject(data);
          keys.forEach(key => localeKeysSet.add(key));
        }
      }
      
      localeKeys[locale] = Array.from(localeKeysSet).sort();
    }
  } catch (error) {
    console.warn(`Warning: Could not load locale keys: ${error.message}`);
  }
  
  return localeKeys;
}

function generateDiffs(codeKeys, localeKeys) {
  const allLocaleKeys = new Set();
  
  // Collect all keys from all locales
  Object.values(localeKeys).forEach(keys => {
    keys.forEach(key => allLocaleKeys.add(key));
  });
  
  const codeKeysSet = new Set(codeKeys);
  const localeKeysSet = allLocaleKeys;
  
  // Keys used in code but missing in locales
  const missingInLocales = Array.from(codeKeysSet).filter(key => !localeKeysSet.has(key)).sort();
  
  // Keys present in locales but not used in code
  const unusedInCode = Array.from(localeKeysSet).filter(key => !codeKeysSet.has(key)).sort();
  
  return { missingInLocales, unusedInCode };
}

function main() {
  const srcDir = process.argv[2] || 'src';
  const localesDir = process.argv[3] || path.join('src', 'app', 'i18n', 'locales');
  const outputDir = process.argv[4] || '.';
  
  console.log(`Scanning source directory: ${srcDir}`);
  console.log(`Loading locales from: ${localesDir}`);
  console.log(`Output directory: ${outputDir}`);
  console.log('');
  
  // Scan source code for translation keys
  console.log('Scanning source files for translation keys...');
  const keysByFile = scanDirectory(srcDir);
  
  // Collect all unique keys from code
  const allCodeKeys = new Set();
  Object.values(keysByFile).forEach(keys => {
    keys.forEach(key => allCodeKeys.add(key));
  });
  const codeKeys = Array.from(allCodeKeys).sort();
  
  // Load locale keys
  console.log('Loading locale keys...');
  const localeKeys = loadLocaleKeys(localesDir);
  
  // Generate diffs
  console.log('Generating cross-check analysis...');
  const { missingInLocales, unusedInCode } = generateDiffs(codeKeys, localeKeys);
  
  // Prepare outputs
  const codeKeysOutput = {
    summary: {
      totalFiles: Object.keys(keysByFile).length,
      totalKeys: codeKeys.length,
      scannedDirectory: srcDir,
      timestamp: new Date().toISOString()
    },
    byFile: keysByFile,
    allKeys: codeKeys
  };
  
  const localeKeysOutput = {
    summary: {
      locales: Object.keys(localeKeys),
      totalLocales: Object.keys(localeKeys).length,
      localesDirectory: localesDir,
      timestamp: new Date().toISOString()
    },
    byLocale: localeKeys
  };
  
  const diffOutput = {
    summary: {
      keysInCodeOnly: missingInLocales.length,
      keysInLocalesOnly: unusedInCode.length,
      totalCodeKeys: codeKeys.length,
      totalLocaleKeys: Array.from(new Set(Object.values(localeKeys).flat())).length,
      timestamp: new Date().toISOString()
    },
    missingInLocales,
    unusedInCode
  };
  
  // Write outputs
  const outputs = [
    { filename: 'tools/output/keys/code-keys.json', data: codeKeysOutput },
    { filename: 'tools/output/keys/code-keys.txt', data: codeKeys.join('\n') },
    { filename: 'tools/output/keys/locale-keys.json', data: localeKeysOutput },
    { filename: 'tools/output/keys/missing-in-locales.txt', data: missingInLocales.join('\n') },
    { filename: 'tools/output/keys/unused-in-code.txt', data: unusedInCode.join('\n') },
    { filename: 'tools/output/keys/i18n-analysis.json', data: diffOutput }
  ];
  
  outputs.forEach(({ filename, data }) => {
    const filePath = path.join(outputDir, filename);
    const content = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
    fs.writeFileSync(filePath, content, 'utf8');
  });
  
  // Print summary
  console.log('\n=== ANALYSIS COMPLETE ===');
  console.log(`Files scanned: ${Object.keys(keysByFile).length}`);
  console.log(`Translation keys found in code: ${codeKeys.length}`);
  console.log(`Locales found: ${Object.keys(localeKeys).join(', ')}`);
  console.log(`Keys in code but missing in locales: ${missingInLocales.length}`);
  console.log(`Keys in locales but unused in code: ${unusedInCode.length}`);
  console.log('');
  console.log('Output files generated:');
  outputs.forEach(({ filename }) => {
    console.log(`  - ${filename}`);
  });
  
  if (missingInLocales.length > 0) {
    console.log('\n⚠️  WARNING: Some keys used in code are missing from locale files!');
    console.log('Check missing-in-locales.txt for details.');
  }
  
  if (unusedInCode.length > 0) {
    console.log('\n💡 INFO: Some locale keys appear to be unused in code.');
    console.log('Check unused-in-code.txt for details.');
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  extractKeysFromFile,
  flattenObject,
  loadLocaleKeys,
  generateDiffs
};
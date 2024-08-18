"use client";

import { useEffect, useState } from 'react';
import Parser from 'web-tree-sitter';

let parserPromise = null;

export function useTreeSitter() {
  const [parsers, setParsers] = useState(null);

  useEffect(() => {
    if (!parserPromise) {
      parserPromise = initParser();
    }
    parserPromise.then(setParsers).catch(error => {
      console.error("Error initializing Tree-sitter:", error);
    });
  }, []);

  return parsers;
}

async function initParser() {
  await Parser.init({
    locateFile(scriptName) {
      return `/${scriptName}`;
    },
  });

  const parsers = {
    javascript: new Parser(),
    python: new Parser(),
    java: new Parser(),
    cpp: new Parser(),
    bash: new Parser(),
    toml: new Parser(),
    yaml: new Parser(),
    typescript: new Parser(),
    html: new Parser(),
  };

  const languages = {
    javascript: await Parser.Language.load('/tree-sitter-javascript.wasm'),
    python: await Parser.Language.load('/tree-sitter-python.wasm'),
    java: await Parser.Language.load('/tree-sitter-java.wasm'),
    cpp: await Parser.Language.load('/tree-sitter-cpp.wasm'),
    bash: await Parser.Language.load('/tree-sitter-bash.wasm'),
    toml: await Parser.Language.load('/tree-sitter-toml.wasm'),
    yaml: await Parser.Language.load('/tree-sitter-yaml.wasm'),
    typescript: await Parser.Language.load('/tree-sitter-typescript.wasm'),
    html: await Parser.Language.load('/tree-sitter-html.wasm'),
  };

  for (const [lang, parser] of Object.entries(parsers)) {
    parser.setLanguage(languages[lang]);
  }

  return parsers;
}

export async function parseRepo(parsers, repoMap) {
  const parsedRepo = {};
  for (const [path, content] of Object.entries(repoMap)) {
    const ext = path.split('.').pop().toLowerCase();
    const lang = getLanguageFromExtension(ext);
    if (lang === null) {
      continue; // Skip this file
    }
    const parser = parsers[lang];

    if (parser) {
      const tree = parser.parse(content);
      parsedRepo[path] = extractFileStructure(tree.rootNode, content, lang);
    } else {
      console.warn(`No parser available for language: ${lang}`);
    }
  }
  return parsedRepo;
}

function getLanguageFromExtension(ext) {
  switch (ext) {
    case 'py': return 'python';
    case 'java': return 'java';
    case 'cpp':
    case 'h': return 'cpp';
    case 'js':
    case 'jsx': return 'javascript';
    case 'ts':
    case 'tsx': return 'typescript';
    case 'sh':
    case 'bash': return 'bash';
    case 'html': return 'html';
    case 'toml': return 'toml';
    case 'yml':
    case 'yaml': return 'yaml';
    // Ignore configuration and system files
    case 'md':
    case 'txt':
    case 'png':
    case 'jpg':
    case 'jpeg':
    case 'gif':
    case 'svg':
    case 'json':
    case 'css':
    case 'scss':
    case 'less':
    case 'gitignore':
    case 'dockerignore':
    case 'flake8':
    case 'env':
    case 'ini':
    case 'cfg':
    case 'config':
    case 'lock':
    case 'log':
    case 'sql':
    case 'db':
    case 'sqlite':
    case 'xml':
    case 'csv':
    case 'ico':
    case 'woff':
    case 'woff2':
    case 'ttf':
    case 'otf':
    case 'eot':
      return null;
    default: return 'javascript'; // Fallback
  }
}

function extractFileStructure(node, content, lang) {
  const structure = [];
  const lines = content.split('\n');

  function traverse(node) {
    let type, name;
    const item = { type: '', name: '', methods: [] };

    switch (lang) {
      case 'javascript':
      case 'typescript':
        if (node.type === 'class_declaration' || node.type === 'function_declaration' || node.type === 'arrow_function' || node.type === 'function') {
          type = node.type === 'class_declaration' ? 'class' : 'function';
          name = node.childForFieldName('name')?.text || 'anonymous';
          item.type = type;
          item.name = name;

          for (let child of node.children) {
            if (child.type === 'method_definition' || child.type === 'function_declaration') {
              const methodName = child.childForFieldName('name')?.text || 'anonymous';
              item.methods.push(methodName);
            }
          }
          structure.push(item);
        } else if (node.type === 'variable_declaration') {
          const declarator = node.childForFieldName('declarator');
          if (declarator) {
            const value = declarator.childForFieldName('value');
            if (value && (value.type === 'arrow_function' || value.type === 'function')) {
              type = 'function';
              name = declarator.childForFieldName('name')?.text || 'anonymous';
              item.type = type;
              item.name = name;
              structure.push(item);
            }
          }
        }
        break;

      case 'python':
        if (node.type === 'class_definition' || node.type === 'function_definition') {
          type = node.type === 'class_definition' ? 'class' : 'function';
          name = node.childForFieldName('name')?.text || 'anonymous';
          item.type = type;
          item.name = name;

          for (let child of node.children) {
            if (child.type === 'function_definition') {
              const methodName = child.childForFieldName('name')?.text || 'anonymous';
              item.methods.push(methodName);
            }
          }
          structure.push(item);
        }
        break;

      case 'bash':
        if (node.type === 'function_definition') {
          type = 'function';
          name = node.childForFieldName('name')?.text || 'anonymous';
          item.type = type;
          item.name = name;
          structure.push(item);
        }
        break;

      case 'html':
        if (node.type === 'element') {
          type = 'element';
          name = node.childForFieldName('tag_name')?.text || 'anonymous';
          item.type = type;
          item.name = name;
          structure.push(item);
        }
        break;

      case 'toml':
      case 'yaml':
        if (node.type === 'table' || node.type === 'pair') {
          type = node.type;
          name = node.childForFieldName('key')?.text || 'anonymous';
          item.type = type;
          item.name = name;
          structure.push(item);
        }
        break;
    }

    for (let child of node.children) {
      traverse(child);
    }
  }

  traverse(node);
  return formatFileStructure(structure, lines);
}

function formatFileStructure(structure, lines) {
  let output = '⋮...\n';

  structure.forEach(item => {
    output += `${item.type} ${item.name}:\n`;
    item.methods.forEach(method => {
      output += `│    ${method}\n`;
    });
    output += '⋮...\n';
  });

  return output;
}

export function renderTree(content, linesOfInterest) {
  const lines = content.split('\n');
  let output = '';

  linesOfInterest.forEach(lineNum => {
    if (lineNum > 0 && lineNum <= lines.length) {
      output += `│${lines[lineNum - 1].trim()}\n`;
    }
  });

  return output;
}

export function toTree(parsedRepo, chatFiles) {
  let output = '';

  for (const [path, structure] of Object.entries(parsedRepo)) {
    if (chatFiles.includes(path)) continue;

    output += `\n${path}:\n`;
    output += structure;
  }

  // Truncate long lines
  output = output.split('\n').map(line => line.slice(0, 100)).join('\n') + '\n';

  return output;
}

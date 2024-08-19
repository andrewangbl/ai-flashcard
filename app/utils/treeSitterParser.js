"use client";

import Parser from 'web-tree-sitter';

let parserPromise = null;

export function useTreeSitter() {
  if (!parserPromise) {
    parserPromise = initializeParser();
  }
  return parserPromise;
}

async function initializeParser() {
  await Parser.init({
    locateFile(scriptName) {
      return `/${scriptName}`;
    },
  });
  const parser = new Parser();
  const Python = await Parser.Language.load("tree-sitter-python.wasm");

  return {
    parser,
    languages: {
      python: Python
    }
  };
}

export async function parseRepo(parserData, repoMap) {
  const { parser, languages } = parserData;
  const parsedRepo = {};

  for (const [path, content] of Object.entries(repoMap)) {
    if (!path.endsWith('.py')) continue;
    try {
      parser.setLanguage(languages.python);

      const tree = parser.parse(content);
      const rootNode = tree.rootNode;

      // Check if the file contains functions or classes
      if (!containsFunctionsOrClasses(rootNode)) {
        continue; // Skip this file
      }

      parsedRepo[path] = {
        structure: extractFileStructure(rootNode, content),
        ast: rootNode
      };
    } catch (error) {
      console.error(`Error parsing ${path}:`, error);
      parsedRepo[path] = {
        structure: `Error parsing file: ${error.message}`,
        ast: null
      };
    }
  }

  return { parsedRepo };
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
    case 'toml':
    case 'yml': return 'yaml';
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

function extractFileStructure(node, content) {
  return 'File structure available in AST';
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

export function toTree(parsedRepo, maxDepth = 25) {
  let output = '';

  for (const [path, data] of Object.entries(parsedRepo)) {
    output += `\n${path}:\n`;
    output += 'AST:\n';
    output += visualizeAST(data.ast, '', maxDepth);
  }

  return output.split('\n').map(line => line.slice(0, 100)).join('\n') + '\n';
}

function visualizeAST(node, indent = '', maxDepth = 10) {
  if (maxDepth === 0) return `${indent}...\n`;

  if (shouldSkipNode(node)) return '';

  let output = `${indent}${node.type}`;
  if (node.type === 'identifier') {
    const text = node.text.replace(/\n/g, '\\n').slice(0, 20);
    output += `: "${text}${text.length > 20 ? '...' : ''}"`;
  }
  output += '\n';

  for (let child of node.namedChildren) {
    output += visualizeAST(child, indent + '  ', maxDepth - 1);
  }

  return output;
}

function shouldSkipNode(node) {
  if (!node) return true;
  const skipTypes = ['comment', 'line_comment', 'block_comment', 'string', 'list'];
  if (skipTypes.includes(node.type)) {
    // For string nodes, only skip if they are multi-line (likely docstrings)
    if (node.type === 'string') {
      return node.text.includes('\n');
    }
    return true;
  }
  return false;
}

function containsFunctionsOrClasses(node) {
  if (!node) return false;
  if (node.type === 'function_definition' || node.type === 'class_definition') {
    return true;
  }
  for (let child of node.namedChildren) {
    if (containsFunctionsOrClasses(child)) {
      return true;
    }
  }
  return false;
}

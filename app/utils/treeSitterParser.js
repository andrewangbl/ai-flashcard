"use client";

import Parser from 'web-tree-sitter';
import CodeAnalyzer from './CodeAnalyzer';
import GraphBuilder from './GraphBuilder';

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
  const JavaScript = await Parser.Language.load("tree-sitter-javascript.wasm");
  const Python = await Parser.Language.load("tree-sitter-python.wasm");

  return {
    parser,
    languages: {
      javascript: JavaScript,
      python: Python
    }
  };
}

export async function parseRepo(parserData, repoMap) {
  const { parser, languages } = parserData;
  const parsedRepo = {};
  const codeAnalyzer = new CodeAnalyzer();
  const graphBuilder = new GraphBuilder();

  for (const [path, content] of Object.entries(repoMap)) {
    try {
      const ext = path.split('.').pop().toLowerCase();
      const language = ext === 'py' ? languages.python : languages.javascript;
      parser.setLanguage(language);

      const tree = parser.parse(content);
      const analysisResult = codeAnalyzer.analyzeCode(tree.rootNode, path);
      parsedRepo[path] = {
        structure: extractFileStructure(tree.rootNode, content),
        ast: tree.rootNode,
        analysis: analysisResult
      };

      graphBuilder.constructGraph([analysisResult]);
    } catch (error) {
      console.error(`Error parsing ${path}:`, error);
      parsedRepo[path] = {
        structure: `Error parsing file: ${error.message}`,
        ast: null
      };
    }
  }

  return { parsedRepo, graphData: graphBuilder.graph };
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

function extractFileStructure(node, content, lang) {
  const structure = [];

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
  return formatFileStructure(structure);
}

function formatFileStructure(structure) {
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


// AST tree limit to 30 levels
export function toTree(parsedRepo, chatFiles, maxDepth = 30) {
  let output = '';

  for (const [path, data] of Object.entries(parsedRepo)) {
    if (chatFiles.includes(path)) continue;

    output += `\n${path}:\n`;
    output += data.structure;
    output += '\nAST:\n';
    output += visualizeAST(data.ast, '', maxDepth);
  }

  return output.split('\n').map(line => line.slice(0, 100)).join('\n') + '\n';
}

function visualizeAST(node, indent = '', maxDepth = 20) {
  if (maxDepth === 0) return `${indent}...\n`;

  // Skip comments and other unnecessary nodes
  if (shouldSkipNode(node)) return '';

  let output = `${indent}${node.type}`;
  if (node.type === 'string' || node.type === 'identifier') {
    output += `: "${node.text}"`;
  }
  output += '\n';

  for (let child of node.namedChildren) {
    output += visualizeAST(child, indent + '  ', maxDepth - 1);
  }

  return output;
}

function shouldSkipNode(node) {
  if (!node) return true;
  const skipTypes = ['comment', 'line_comment', 'block_comment'];
  return skipTypes.includes(node.type);
}

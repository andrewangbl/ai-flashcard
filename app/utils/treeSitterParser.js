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
    parserPromise.then(setParsers);
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
    cpp: new Parser()
  };

  const languages = {
    javascript: await Parser.Language.load('/tree-sitter-javascript.wasm'),
    python: await Parser.Language.load('/tree-sitter-python.wasm'),
    java: await Parser.Language.load('/tree-sitter-java.wasm'),
    cpp: await Parser.Language.load('/tree-sitter-cpp.wasm')
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
    const lang = ext === 'py' ? 'python' :
                 ext === 'java' ? 'java' :
                 ext === 'cpp' || ext === 'h' ? 'cpp' : 'javascript';
    const parser = parsers[lang];
    const tree = parser.parse(content);
    parsedRepo[path] = extractFileStructure(tree.rootNode, content, lang);
  }
  return parsedRepo;
}

function extractFileStructure(node, content, lang) {
  const structure = [];
  const lines = content.split('\n');

  function traverse(node, depth = 0) {
    let type, name, decorators = [];
    switch (lang) {
      case 'python':
        if (node.type === 'decorated_definition') {
          const definition = node.childForFieldName('definition');
          if (definition) {
            const decoratorNodes = node.childForFieldName('decorators').children;
            decorators = decoratorNodes.map(d => d.text.trim());
            return traverse(definition, depth);
          }
        }
        if (node.type === 'class_definition' || node.type === 'function_definition') {
          type = node.type === 'class_definition' ? 'class' : 'function';
          name = node.childForFieldName('name')?.text || 'anonymous';
          const startLine = node.startPosition.row + 1;
          const endLine = node.endPosition.row + 1;
          const item = { type, name, startLine, endLine, decorators, children: [] };

          for (let child of node.children) {
            const childItem = traverse(child, depth + 1);
            if (childItem) item.children.push(childItem);
          }

          return item;
        }
        break;
      case 'java':
      case 'cpp':
        if (node.type === 'class_specifier' || node.type === 'function_definition') {
          type = node.type === 'class_specifier' ? 'class' : 'function';
          name = node.childForFieldName('name')?.text ||
                 node.descendantsOfType('identifier')[0]?.text || 'anonymous';
        }
        break;
      default: // javascript
        if (node.type === 'class_declaration' || node.type === 'function_declaration' ||
            node.type === 'method_definition' || node.type === 'arrow_function' ||
            node.type === 'variable_declaration') {
          if (node.type === 'variable_declaration') {
            const declarationsNode = node.childForFieldName('declarations');
            const declarationNode = declarationsNode?.firstChild;
            if (declarationNode) {
              name = declarationNode.childForFieldName('name')?.text || 'anonymous';
              const valueNode = declarationNode.childForFieldName('value');
              type = (valueNode?.type === 'arrow_function' || valueNode?.type === 'function') ? 'function' : 'variable';
            } else {
              // Handle case where there are no declarations
              type = 'variable';
              name = 'anonymous';
            }
          } else {
            type = node.type === 'class_declaration' ? 'class' : 'function';
            name = node.childForFieldName('name')?.text || 'anonymous';
          }
        }
    }

    if (type && name) {
      const startLine = node.startPosition.row + 1;
      const endLine = node.endPosition.row + 1;
      const item = { type, name, startLine, endLine, decorators, children: [] };

      for (let child of node.children) {
        const childItem = traverse(child, depth + 1);
        if (childItem) item.children.push(childItem);
      }

      return item;
    }

    for (let child of node.children) {
      const result = traverse(child, depth);
      if (result) structure.push(result);
    }
  }

  traverse(node);
  return formatFileStructure(structure, lines);
}

function formatFileStructure(structure, lines) {
  let output = '⋮...\n';

  function addItem(item, indent = '') {
    if (item.decorators && item.decorators.length > 0) {
      item.decorators.forEach(decorator => {
        output += `${indent}│${decorator}\n`;
      });
    }
    output += `${indent}│${item.type} ${item.name}:\n`;
    for (let i = item.startLine; i <= item.endLine; i++) {
      const line = lines[i - 1].trim();
      if (line) {
        output += `${indent}│    ${line}\n`;
      }
    }
    if (item.children.length > 0) {
      item.children.forEach(child => addItem(child, indent + '│    '));
    } else {
      output += `${indent}│    ⋮...\n`;
    }
  }

  structure.forEach(item => addItem(item));
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

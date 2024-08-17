"use client";

import React, { useEffect, useState } from 'react';
import { useTreeSitter } from '../utils/treeSitterParser';

function extractDefinitions(content) {
  const lines = content.split('\n');
  const definitions = [];

  const functionRegex = /function\s+(\w+)/;
  const classRegex = /class\s+(\w+)/;
  const variableRegex = /(const|let|var)\s+(\w+)/;

  lines.forEach((line, index) => {
    const functionMatch = line.match(functionRegex);
    const classMatch = line.match(classRegex);
    const variableMatch = line.match(variableRegex);

    if (functionMatch) {
      definitions.push({ type: 'function', name: functionMatch[1], line: index + 1 });
    } else if (classMatch) {
      definitions.push({ type: 'class', name: classMatch[1], line: index + 1 });
    } else if (variableMatch) {
      definitions.push({ type: 'variable', name: variableMatch[2], line: index + 1 });
    }
  });

  return definitions;
}

function buildRepoMap(repoContents) {
  const repoMap = {};

  for (const file of repoContents) {
    if (file.type === 'file' && (file.name.endsWith('.js') || file.name.endsWith('.ts') || file.name.endsWith('.py'))) {
      repoMap[file.path] = file.content;
    }
  }

  return repoMap;
}

function extractFileStructure(ast, content) {
  const fileMap = [];
  const lines = content.split('\n');

  function traverse(node, depth = 0) {
    const type = node.type;
    const startLine = node.startPosition.row + 1;
    const endLine = node.endPosition.row + 1;

    if (type === 'class_definition' || type === 'function_definition' || type === 'method_definition') {
      const name = node.childForFieldName('name').text;
      const item = {
        type: type === 'class_definition' ? 'class' : 'function',
        name,
        startLine,
        endLine,
        children: []
      };

      for (let child of node.children) {
        traverse(child, depth + 1);
      }

      if (depth === 0) {
        fileMap.push(item);
      } else {
        return item;
      }
    } else {
      for (let child of node.children) {
        const result = traverse(child, depth);
        if (result) {
          if (depth === 0) {
            fileMap.push(result);
          } else {
            return result;
          }
        }
      }
    }
  }

  traverse(ast);

  return formatFileMap(fileMap, lines);
}

function formatFileMap(fileMap, lines) {
  let output = '';

  for (const item of fileMap) {
    output += `${item.type} ${item.name}:\n`;
    for (let i = item.startLine; i <= item.endLine; i++) {
      const line = lines[i - 1].trim();
      if (line) {
        output += `│${line}\n`;
      }
    }
    output += '⋮...\n';
  }

  return output.trim();
}

export { buildRepoMap };

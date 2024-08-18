import Parser from 'tree-sitter';
import Python from 'tree-sitter-python';

const pythonParser = new Parser();
pythonParser.setLanguage(Python);

function analyzeCode(code, filePath) {
  const tree = pythonParser.parse(code);
  let functions = [];
  let imports = [];

  const traverse = (node) => {
    switch (node.type) {
      case 'import_statement':
      case 'import_from_statement':
        imports.push(node.text);
        break;
      case 'function_definition':
        const functionName = node.childForFieldName('name')?.text;
        if (functionName) {
          functions.push(functionName);
        }
        break;
    }
    node.children.forEach(traverse);
  };

  traverse(tree.rootNode);

  return { filePath, functions, imports };
}

export function parseRepo(repoMap) {
  const parsedRepo = {};

  for (const [path, content] of Object.entries(repoMap)) {
    if (path.endsWith('.py')) {
      parsedRepo[path] = analyzeCode(content, path);
    }
  }

  return parsedRepo;
}

// app/utils/CodeAnalyzer.js
class CodeAnalyzer {
  constructor() {
    this.nodeId = 0; // To uniquely identify nodes
  }

  getImportType(importText) {
    const stdLibModules = ['os', 'sys', 'datetime', 'math', 'random', 'json', 're', 'collections', 'itertools'];
    const importName = importText.split(' ')[1].split('.')[0];

    if (stdLibModules.includes(importName)) {
      return 'standard';
    } else if (importText.startsWith('from .') || importText.startsWith('from ..')) {
      return 'internal';
    } else {
      return 'external';
    }
  }

  analyzeCode(ast, filePath) {
    const structure = {
      symbols: [],
      imports: { standard: [], external: [], internal: [] }
    };

    const traverse = (node, parent = null) => {
      switch (node.type) {
        case 'import_statement':
        case 'import_from_statement':
          const importText = node.text;
          const importType = this.getImportType(importText);
          structure.imports[importType].push(importText);
          break;
        case 'function_definition':
        case 'class_definition':
          const name = node.childForFieldName('name')?.text;
          if (name) {
            structure.symbols.push({
              type: node.type === 'function_definition' ? 'function' : 'class',
              name: name,
              startLine: node.startPosition.row + 1,
              endLine: node.endPosition.row + 1
            });
          }
          break;
      }
      node.children.forEach(child => traverse(child, node));
    };

    traverse(ast);

    return { filePath, structure };
  }
}

export default CodeAnalyzer;

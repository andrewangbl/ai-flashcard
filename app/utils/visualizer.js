import { Network } from 'vis-network/standalone';

export function visualizeAST(node, indent = '') {
  let output = `${indent}${node.type}`;
  if (node.type === 'string' || node.type === 'identifier') {
    output += `: "${node.text}"`;
  }
  output += '\n';

  for (let i = 0; i < node.childCount; i++) {
    output += visualizeAST(node.child(i), indent + '  ');
  }

  return output;
}

export function toTreeVisualizer(parsedRepo, chatFiles) {
  let output = '';

  for (const [path, data] of Object.entries(parsedRepo)) {
    if (chatFiles.includes(path)) continue;

    output += `\n${path}:\n`;
    output += 'AST:\n';
    output += visualizeAST(data.ast);
  }

  // Truncate long lines
  output = output.split('\n').map(line => line.slice(0, 100)).join('\n') + '\n';

  return output;
}

export function createNetworkGraph(container, parsedRepo) {
  const data = convertToGraphData(parsedRepo);
  const options = {
    layout: {
      hierarchical: {
        direction: 'UD',
        sortMethod: 'directed'
      }
    }
  };
  return new Network(container, data, options);
}

function convertToGraphData(parsedRepo) {
  const nodes = [];
  const edges = [];
  let id = 0;

  function addNode(structure, parentId = null) {
    const nodeId = id++;
    nodes.push({ id: nodeId, label: `${structure.type}${structure.name ? ': ' + structure.name : ''}` });
    if (parentId !== null) {
      edges.push({ from: parentId, to: nodeId });
    }
    structure.children.forEach(child => addNode(child, nodeId));
  }

  for (const [path, data] of Object.entries(parsedRepo)) {
    if (data.ast) {
      addNode(data.ast);
    }
  }

  return { nodes, edges };
}

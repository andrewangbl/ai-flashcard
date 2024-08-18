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

export function createNetworkGraph(container, graph) {
  const data = {
    nodes: graph.nodes.map(node => ({
      id: node.id,
      label: node.id,
      color: node.id.endsWith('.py') ? '#97c2fc' : '#ffb3ba' // Different colors for files and imports
    })),
    edges: graph.edges.map(edge => ({
      from: edge.source,
      to: edge.target,
      arrows: 'to'
    }))
  };

  const options = {
    layout: {
      hierarchical: {
        direction: 'UD',
        sortMethod: 'directed',
        levelSeparation: 150,
        nodeSpacing: 200
      }
    },
    nodes: {
      shape: 'box',
      font: {
        size: 12,
        face: 'monospace'
      }
    },
    edges: {
      width: 2
    },
    physics: {
      enabled: true,
      hierarchicalRepulsion: {
        centralGravity: 0.0,
        springLength: 250,
        springConstant: 0.01,
        nodeDistance: 100,
        damping: 0.09
      },
      solver: 'hierarchicalRepulsion'
    }
  };

  return new Network(container, data, options);
}

function convertToGraphData(parsedRepo) {
  const nodes = [];
  const edges = [];
  let id = 0;

  function addNode(node, parentId = null) {
    const nodeId = id++;
    const label = node.type + (node.text ? `: "${node.text}"` : '');
    nodes.push({ id: nodeId, label: label });
    if (parentId !== null) {
      edges.push({ from: parentId, to: nodeId });
    }
    if (node.namedChildren) {
      node.namedChildren.forEach(child => addNode(child, nodeId));
    }
  }

  for (const [path, data] of Object.entries(parsedRepo)) {
    if (data.ast) {
      addNode(data.ast);
    }
  }

  return { nodes, edges };
}

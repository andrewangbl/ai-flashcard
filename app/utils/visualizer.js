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

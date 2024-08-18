// app/utils/GraphBuilder.js
class GraphBuilder {
  constructor() {
    this.graph = { nodes: [], edges: [] };
  }

  addNode(id, content = null) {
    if (!this.graph.nodes.some(node => node.id === id)) {
      this.graph.nodes.push({ id, content });
    }
  }

  addEdge(source, target) {
    this.addNode(source);
    this.addNode(target);
    if (!this.graph.edges.some(edge => edge.source === source && edge.target === target)) {
      this.graph.edges.push({ source, target });
    }
  }

  constructGraph(analysisResults) {
    const stdLibModules = ['os', 'sys', 'datetime', 'math', 'random', 'json', 're', 'collections', 'itertools'];

    analysisResults.forEach(({ filePath, structure }) => {
      this.addNode(filePath, structure);

      // Handle all non-standard library imports
      structure.imports.external.concat(structure.imports.internal).forEach(importLine => {
        const importedModule = importLine.split(' ')[1].split('.')[0];
        if (!stdLibModules.includes(importedModule)) {
          this.addEdge(importLine, filePath);
        }
      });

      // Add symbol information
      structure.symbols.forEach(symbol => {
        this.addNode(`${filePath}:${symbol.name}`, symbol);
        this.addEdge(filePath, `${filePath}:${symbol.name}`);
      });
    });

    return this.graph;
  }
}

export default GraphBuilder;

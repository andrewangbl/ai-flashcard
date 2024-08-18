"use client";

import React, { useEffect, useState } from 'react';
import { useTreeSitter, parseRepo, toTree } from '../utils/treeSitterParser';
import styles from './RepoViewer.module.css';

export default function RepoViewer({ repoMap, chatFiles }) {
  const [parser, setParser] = useState(null);
  const [parserError, setParserError] = useState(null);
  const [parsedRepo, setParsedRepo] = useState({});
  const [treeView, setTreeView] = useState('');
  const [graphData, setGraphData] = useState(null);

  useEffect(() => {
    useTreeSitter()
      .then(initializedParser => {
        setParser(initializedParser);
      })
      .catch(error => {
        console.error("Error initializing Tree-sitter:", error);
        setParserError(error.message);
      });
  }, []);

  useEffect(() => {
    if (parser && repoMap) {
      parseRepo(parser, repoMap)
        .then(({ parsedRepo, graphData }) => {
          setParsedRepo(parsedRepo);
          setTreeView(toTree(parsedRepo, chatFiles));
          setGraphData(graphData);
        })
        .catch(error => {
          console.error("Error parsing repo:", error);
          setTreeView("Error parsing repository: " + error.message);
        });
    }
  }, [parser, repoMap, chatFiles]);

  return (
    <div className={styles.container}>
      <h2>Repository Structure and Symbols:</h2>
      {parserError ? (
        <p>Error initializing parser: {parserError}</p>
      ) : (
        <>
          <pre className={styles.fileContent}>{treeView}</pre>
          <h3>Symbols:</h3>
          <ul className={styles.symbolList}>
            {graphData && graphData.nodes.map(node =>
              node.content && node.content.type && (
                <li key={node.id}>
                  {node.content.type}: {node.content.name} (Lines {node.content.startLine}-{node.content.endLine})
                </li>
              )
            )}
          </ul>
          <h3>Graph Data:</h3>
          <pre className={styles.graphData}>{JSON.stringify(graphData, null, 2)}</pre>
        </>
      )}
    </div>
  );
}

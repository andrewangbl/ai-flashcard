"use client";

import React, { useEffect, useState } from 'react';
import { useTreeSitter, parseRepo, toTree } from '../utils/treeSitterParser';
import styles from './RepoViewer.module.css';

export default function RepoViewer({ repoMap }) {
  const [parser, setParser] = useState(null);
  const [parserError, setParserError] = useState(null);
  const [treeView, setTreeView] = useState('');
  const [astOutput, setAstOutput] = useState('');

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
      const pythonFiles = Object.entries(repoMap).filter(([path]) => path.endsWith('.py'));
      if (pythonFiles.length === 0) {
        setTreeView("No Python files found in the repository.");
        return;
      }

      parseRepo(parser, Object.fromEntries(pythonFiles))
        .then(({ parsedRepo }) => {
          const treeString = toTree(parsedRepo);
          setTreeView(treeString);
          setAstOutput(treeString); // Store the AST output in a variable
        })
        .catch(error => {
          console.error("Error parsing repo:", error);
          setTreeView("Error parsing repository: " + error.message);
        });
    }
  }, [parser, repoMap]);

  return (
    <div className={styles.container}>
      <h2>Python Repository AST Structure:</h2>
      {parserError ? (
        <p>Error initializing parser: {parserError}</p>
      ) : (
        <pre className={styles.fileContent}>{treeView}</pre>
      )}
    </div>
  );
}

"use client";

import React, { useEffect, useState } from 'react';
import { useTreeSitter, parseRepo, toTree } from '../utils/treeSitterParser';
import styles from './RepoViewer.module.css';

export default function RepoViewer({ repoMap, chatFiles }) {
  const [parser, setParser] = useState(null);
  const [parserError, setParserError] = useState(null);
  const [parsedRepo, setParsedRepo] = useState({});
  const [treeView, setTreeView] = useState('');

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
        .then(parsed => {
          setParsedRepo(parsed);
          setTreeView(toTree(parsed, chatFiles));
        })
        .catch(error => {
          console.error("Error parsing repo:", error);
          setTreeView("Error parsing repository: " + error.message);
        });
    }
  }, [parser, repoMap, chatFiles]);

  return (
    <div className={styles.container}>
      <h2>Repository Structure and AST:</h2>
      {parserError ? (
        <p>Error initializing parser: {parserError}</p>
      ) : (
        <pre className={styles.fileContent}>{treeView}</pre>
      )}
    </div>
  );
}

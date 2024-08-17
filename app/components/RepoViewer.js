"use client";

import React, { useEffect, useState } from 'react';
import { useTreeSitter, parseRepo, toTree } from '../utils/treeSitterParser';
import styles from './RepoViewer.module.css';

export default function RepoViewer({ repoMap, chatFiles }) {
  const parsers = useTreeSitter();
  const [parsedRepo, setParsedRepo] = useState({});
  const [treeView, setTreeView] = useState('');

  useEffect(() => {
    if (parsers && repoMap) {
      parseRepo(parsers, repoMap).then(parsed => {
        setParsedRepo(parsed);
        setTreeView(toTree(parsed, chatFiles));
      });
    }
  }, [parsers, repoMap, chatFiles]);

  return (
    <div className={styles.container}>
      <h2>Repository Structure:</h2>
      <pre className={styles.fileContent}>{treeView}</pre>
    </div>
  );
}

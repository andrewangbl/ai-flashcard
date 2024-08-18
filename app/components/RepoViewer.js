"use client";

import React, { useEffect, useState } from 'react';
import styles from './RepoViewer.module.css';

export default function RepoViewer({ repoMap, chatFiles }) {
  const [parsedRepo, setParsedRepo] = useState({});
  const [treeView, setTreeView] = useState('');

  useEffect(() => {
    if (repoMap) {
      fetch('/api/parseRepo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ repoMap }),
      })
        .then(response => response.json())
        .then(data => {
          setParsedRepo(data.parsedRepo);
          setTreeView(toTree(data.parsedRepo, chatFiles));
        })
        .catch(error => console.error('Error:', error));
    }
  }, [repoMap, chatFiles]);

  return (
    <div className={styles.container}>
      <h2>Repository Structure:</h2>
      <pre className={styles.fileContent}>{treeView}</pre>
    </div>
  );
}

function toTree(parsedRepo, chatFiles) {
  let output = '';

  for (const [path, structure] of Object.entries(parsedRepo)) {
    if (chatFiles.includes(path)) continue;

    output += `\n${path}:\n`;
    output += `  Functions:\n${structure.functions.map(f => `    ${f}`).join('\n')}\n`;
    output += `  Imports:\n${structure.imports.map(i => `    ${i}`).join('\n')}\n`;
  }

  return output;
}

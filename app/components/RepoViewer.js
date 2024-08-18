"use client";

import React, { useEffect, useState } from 'react';
import { summarizeFile, createRepoMap } from '../utils/langchainSummarizer';
import styles from './RepoViewer.module.css';

export default function RepoViewer({ repoContents, chatFiles }) {
  const [repoMap, setRepoMap] = useState('');

  useEffect(() => {
    async function generateRepoMap() {
      if (repoContents) {
        const fileSummaries = await Promise.all(
          Object.entries(repoContents)
            .filter(([path]) => !chatFiles.includes(path))
            .map(async ([path, { content }]) => {
              const summary = await summarizeFile(content);
              return `${path}:\n${summary}`;
            })
        );

        const fullRepoMap = await createRepoMap(fileSummaries.join('\n\n'));
        setRepoMap(fullRepoMap);
      }
    }

    generateRepoMap();
  }, [repoContents, chatFiles]);

  return (
    <div className={styles.container}>
      <h2>Repository Structure:</h2>
      <pre className={styles.fileContent}>{repoMap}</pre>
    </div>
  );
}

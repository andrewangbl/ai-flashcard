"use client";

import React, { useEffect, useState } from 'react';
import styles from './RepoViewer.module.css';

export default function RepoViewer({ repoContents, chatFiles }) {
  const [repoMap, setRepoMap] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    async function generateRepoMap() {
      if (repoContents) {
        try {
          const response = await fetch('/api/getrepo', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ repoUrl: repoContents.url }),
          });
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error);
          }
          const repoMap = await response.json();
          setRepoMap(repoMap);
          setError(null);
        } catch (error) {
          console.error('Error generating repo map:', error);
          setError(error.message);
          setRepoMap('');
        }
      }
    }

    generateRepoMap();
  }, [repoContents]);

  return (
    <div className={styles.container}>
      <h2>Repository Structure:</h2>
      {error ? (
        <p className={styles.error}>{error}</p>
      ) : (
        <pre className={styles.fileContent}>{repoMap}</pre>
      )}
    </div>
  );
}

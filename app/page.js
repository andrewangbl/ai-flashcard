'use client';

import { useState } from 'react';
import RepoForm from './components/RepoForm';
import RepoViewer from './components/RepoViewer';

export default function Home() {
  const [repoContents, setRepoContents] = useState(null);
  const [chatFiles, setChatFiles] = useState([]);
  const [error, setError] = useState(null);

  const handleSubmit = async ({ repoUrl }) => {
    try {
      const response = await fetch('/api/getrepo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repoUrl })
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch repository');
      }
      setRepoContents(data);
      setChatFiles([]); // Reset chat files when fetching a new repo
      setError(null);
    } catch (error) {
      console.error('Error fetching repository:', error);
      setError(error.message);
      setRepoContents(null);
    }
  };

  return (
    <main style={{ padding: '20px', maxWidth: '100%' }}>
      <h1>GitHub Repository Mapper</h1>
      <RepoForm onSubmit={handleSubmit} />
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {repoContents && <RepoViewer repoMap={repoContents} chatFiles={chatFiles} />}
    </main>
  );
}

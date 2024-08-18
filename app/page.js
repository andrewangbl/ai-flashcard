'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Typography, Paper, TextField, Button } from '@mui/material';
import RepoForm from './components/RepoForm';
import RepoViewer from './components/RepoViewer';

export default function Home() {
  const [repoContents, setRepoContents] = useState(null);
  const [chatFiles, setChatFiles] = useState([]);
  const [error, setError] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const email = localStorage.getItem('email');
    if (!email) {
      router.push('/signin'); 
    }
  }, []);

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
      setChatFiles([]);
      setError(null);
    } catch (error) {
      console.error('Error fetching repository:', error);
      setError(error.message);
      setRepoContents(null);
    }
  };

  return (
    <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" minHeight="100vh" sx={{ bgcolor: '#F4F4F9', padding: 4 }}>
      <Paper elevation={3} sx={{ padding: 4, width: '100%', maxWidth: '800px', textAlign: 'center', bgcolor: 'white' }}>
        <Typography variant="h4" component="h1" sx={{ marginBottom: 4 }}>
          GitHub Repository Mapper
        </Typography>
        <RepoForm onSubmit={handleSubmit} />
        {error && <Typography color="error" sx={{ marginTop: 2 }}>{error}</Typography>}
        {repoContents && (
          <Box mt={4}>
            <RepoViewer repoMap={repoContents} chatFiles={chatFiles} />
          </Box>
        )}
      </Paper>
    </Box>
  );
}

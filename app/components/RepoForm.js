import { useState } from 'react';
import { TextField, Button, Box, Typography, Paper } from '@mui/material';

export default function RepoForm({ onSubmit }) {
  const [repoUrl, setRepoUrl] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ repoUrl });
  };

  return (
    <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" height="100vh" sx={{ bgcolor: '#F4F4F9', padding: 4 }}>
      <Paper elevation={3} sx={{ padding: 4, width: '100%', maxWidth: '400px', textAlign: 'center', bgcolor: 'white' }}>
        <Typography variant="h4" component="h1" sx={{ marginBottom: 2 }}>
          Fetch Repository
        </Typography>
        <form onSubmit={handleSubmit}>
          <TextField
            label="GitHub Repository URL"
            type="text"
            value={repoUrl}
            onChange={(e) => setRepoUrl(e.target.value)}
            fullWidth
            margin="normal"
            variant="outlined"
            sx={{ marginBottom: 2 }}
            required
          />
          <Button type="submit" variant="contained" fullWidth sx={{ bgcolor: '#333', color: '#FFF', marginBottom: 2, '&:hover': { bgcolor: '#444' } }}>
            Fetch Repository
          </Button>
        </form>
      </Paper>
    </Box>
  );
}

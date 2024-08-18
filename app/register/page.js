'use client';

import { useState } from 'react';
import { TextField, Button, Box, Typography, Paper } from '@mui/material';
import { useRouter } from 'next/navigation';

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleRegister = async (e) => {
    e.preventDefault();
    const res = await fetch('/api/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    if (res.ok) {
      localStorage.setItem('email', email); 
      router.push('/'); 
    } else {
      const errorData = await res.json();
      setError(errorData.message);
    }
  };

  return (
    <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" height="100vh" sx={{ bgcolor: '#F4F4F9', padding: 4 }}>
      <Paper elevation={3} sx={{ padding: 4, width: '100%', maxWidth: '400px', textAlign: 'center', bgcolor: 'white' }}>
        <Typography variant="h4" component="h1" sx={{ marginBottom: 2 }}>
          Register
        </Typography>
        <TextField
          label="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          fullWidth
          margin="normal"
          variant="outlined"
          sx={{ marginBottom: 2 }}
        />
        <TextField
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          fullWidth
          margin="normal"
          variant="outlined"
          sx={{ marginBottom: 2 }}
        />
        {error && <Typography color="error" sx={{ marginBottom: 2 }}>{error}</Typography>}
        <Button variant="contained" onClick={handleRegister} fullWidth sx={{ bgcolor: '#333', color: '#FFF', marginBottom: 2, '&:hover': { bgcolor: '#444' } }}>
          Register
        </Button>
        <Button onClick={() => router.push('/signin')} fullWidth sx={{ color: '#333', '&:hover': { color: '#555' } }}>
          Already have an account? Sign In
        </Button>
      </Paper>
    </Box>
  );
}

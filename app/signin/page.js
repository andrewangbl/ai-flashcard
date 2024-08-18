'use client';

import { useState, useEffect } from 'react';
import { TextField, Button, Box, Typography, Paper } from '@mui/material';
import { useRouter } from 'next/navigation';
import { signInUser } from '../../lib/auth'; 

export default function SignIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    const email = localStorage.getItem('email');
    if (email) {
      router.push('/');
    }
  }, [router]);

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSignIn = async () => {
    if (!validateEmail(email)) {
      setError('Please enter a valid email address.');
      return;
    }

    const response = await signInUser(email, password);
    if (response.success) {
      localStorage.setItem('email', email); 
      router.push('/');
    } else {
      setError(response.message);
    }
  };

  return (
    <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" height="100vh" sx={{ bgcolor: '#F4F4F9', padding: 4 }}>
      <Paper elevation={3} sx={{ padding: 4, width: '100%', maxWidth: '400px', textAlign: 'center', bgcolor: 'white' }}>
        <Typography variant="h4" component="h1" sx={{ marginBottom: 2 }}>
          Sign In
        </Typography>
        <TextField
          label="Email"
          type="email"
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
        <Button variant="contained" onClick={handleSignIn} fullWidth sx={{ bgcolor: '#333', color: '#FFF', marginBottom: 2, '&:hover': { bgcolor: '#444' } }}>
          Sign In
        </Button>
        <Button onClick={() => router.push('/register')} fullWidth sx={{ color: '#333', '&:hover': { color: '#555' } }}>
          Don&apos;t have an account? Sign Up
        </Button>
      </Paper>
    </Box>
  );
}

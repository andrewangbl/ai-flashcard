'use client';

import { useState } from 'react';
import { Box, Typography, Paper, TextField, Button } from '@mui/material';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

function CheckoutForm({ onSubmit, repoUrl, setRepoUrl }) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Ensure the repository URL is not empty
    if (!repoUrl) {
      setError('Repository URL is required.');
      setLoading(false);
      return;
    }

    const res = await fetch('/api/create-payment-intent', {
      method: 'POST',
    });

    if (!res.ok) {
      const errorData = await res.json();
      setError(errorData.error);
      setLoading(false);
      return;
    }

    const { clientSecret } = await res.json();

    const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
      payment_method: {
        card: elements.getElement(CardElement),
      },
    });

    if (stripeError) {
      setError(stripeError.message);
      setLoading(false);
      return;
    }

    // Payment succeeded, proceed with the form submission
    onSubmit({ repoUrl });
    setLoading(false);
  };

  return (
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
      <CardElement options={{ style: { base: { fontSize: '16px' } } }} />
      {error && <Typography color="error" sx={{ marginBottom: 2 }}>{error}</Typography>}
      <Button type="submit" variant="contained" fullWidth sx={{ bgcolor: '#333', color: '#FFF', marginTop: 2, '&:hover': { bgcolor: '#444' } }} disabled={loading || !stripe || !elements}>
        {loading ? 'Processing...' : 'Pay $10 and Fetch Repository'}
      </Button>
    </form>
  );
}

export default function RepoForm({ onSubmit }) {
  const [repoUrl, setRepoUrl] = useState('');

  return (
    <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" height="100vh" sx={{ bgcolor: '#F4F4F9', padding: 4 }}>
      <Paper elevation={3} sx={{ padding: 4, width: '100%', maxWidth: '400px', textAlign: 'center', bgcolor: 'white' }}>
        <Typography variant="h4" component="h1" sx={{ marginBottom: 2 }}>
          Fetch Repository
        </Typography>
        <Elements stripe={stripePromise}>
          <CheckoutForm onSubmit={onSubmit} repoUrl={repoUrl} setRepoUrl={setRepoUrl} />
        </Elements>
      </Paper>
    </Box>
  );
}

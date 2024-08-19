'use client';

import { loadStripe } from '@stripe/stripe-js';
import { Button } from '@mui/material';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

export default function CheckoutButton() {
  const handleCheckout = async () => {
    const stripe = await stripePromise;

    const response = await fetch('/api/checkout_session', {
      method: 'POST',
    });

    const session = await response.json();

    const result = await stripe.redirectToCheckout({
      sessionId: session.id,
    });

    if (result.error) {
      console.error(result.error.message);
    }
  };

  return (
    <Button variant="contained" onClick={handleCheckout} fullWidth sx={{ bgcolor: '#333', color: '#FFF', marginBottom: 2, '&:hover': { bgcolor: '#444' } }}>
      Pay $10 to Access
    </Button>
  );
}

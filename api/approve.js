// api/approve.js
// Called by Pi SDK when payment is ready for server approval
// Pi requires this within 60 seconds or payment expires

module.exports = async function handler(req, res) {
  // Allow cross-origin requests from Pi Browser
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { paymentId } = req.body;

    if (!paymentId) {
      return res.status(400).json({ error: 'Missing paymentId' });
    }

    // Verify payment with Pi Platform API
    const piResponse = await fetch(
      `https://api.minepi.com/v2/payments/${paymentId}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Key ${process.env.PI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!piResponse.ok) {
      const error = await piResponse.text();
      console.error('Pi API error:', error);
      return res.status(400).json({ error: 'Failed to verify payment with Pi' });
    }

    const payment = await piResponse.json();
    console.log('Payment verified:', payment.identifier, 'Amount:', payment.amount);

    // Approve the payment
    const approveResponse = await fetch(
      `https://api.minepi.com/v2/payments/${paymentId}/approve`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Key ${process.env.PI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!approveResponse.ok) {
      const error = await approveResponse.text();
      console.error('Approve error:', error);
      return res.status(400).json({ error: 'Failed to approve payment' });
    }

    const approved = await approveResponse.json();
    console.log('Payment approved:', approved.identifier);

    return res.status(200).json({
      success: true,
      paymentId: approved.identifier,
      amount: approved.amount
    });

  } catch (error) {
    console.error('Server error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

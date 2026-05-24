// api/complete.js
// Called by Pi SDK after blockchain transaction is confirmed
// Must be called to finalize payment

export default async function handler(req, res) {
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
    const { paymentId, txid } = req.body;

    if (!paymentId || !txid) {
      return res.status(400).json({ error: 'Missing paymentId or txid' });
    }

    // Complete the payment on Pi Platform
    const completeResponse = await fetch(
      `https://api.minepi.com/v2/payments/${paymentId}/complete`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Key ${process.env.PI_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ txid })
      }
    );

    if (!completeResponse.ok) {
      const error = await completeResponse.text();
      console.error('Complete error:', error);
      return res.status(400).json({ error: 'Failed to complete payment' });
    }

    const completed = await completeResponse.json();
    console.log('Payment completed:', completed.identifier, 'TxID:', txid);

    return res.status(200).json({
      success: true,
      paymentId: completed.identifier,
      txid: txid,
      amount: completed.amount
    });

  } catch (error) {
    console.error('Server error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

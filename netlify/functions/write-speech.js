const https = require('https');

exports.handler = async function(event) {
  console.log('Function started');
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }
  const data = JSON.parse(event.body);
  const { pkg, occasion, honoree, heat, dirt, offLimits, tone } = data;
  
  const requestBody = JSON.stringify({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1000,
    messages: [{ role: 'user', content: `Write a funny ${occasion} speech roasting ${honoree}. Heat level: ${heat}. Material: ${dirt}. Off limits: ${offLimits || 'none'}. Tone: ${tone || 'funny'}. Keep it under 500 words.` }]
  });

  return new Promise((resolve) => {
    const options = {
      hostname: 'api.anthropic.com',
      path: '/v1/messages',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_KEY,
        'anthropic-version': '2023-06-01',
        'Content-Length': Buffer.byteLength(requestBody)
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      console.log('Status:', res.statusCode);
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        console.log('Response:', body.substring(0, 300));
        try {
          const parsed = JSON.parse(body);
          const speech = parsed.content[0].text;
          resolve({ statusCode: 200, body: JSON.stringify({ speech }) });
        } catch (err) {
          resolve({ statusCode: 500, body: JSON.stringify({ error: err.message, raw: body }) });
        }
      });
    });

    req.on('error', (err) => {
      resolve({ statusCode: 500, body: JSON.stringify({ error: err.message }) });
    });

    req.write(requestBody);
    req.end();
  });
};

const https = require('https');

exports.handler = async function(event) {
  console.log('Function started');
  
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const data = JSON.parse(event.body);
  console.log('Data received:', JSON.stringify(data));
  
  const { pkg, occasion, honoree, relationship, eventDate, audience, heat, dirt, offLimits, tone } = data;

  const heatInstructions = {
    mild: 'Keep the humor clean and warm. Safe for all ages including children and grandparents. Playful teasing, no edge.',
    medium: 'Include some sharp wit and light edge. A few jokes that make people gasp before laughing. Adult but not explicit.',
    hot: 'Gloves off. Bold adult humor, no sacred cows. Push boundaries while keeping it about the person being roasted.'
  };

  const packageLengths = {
    standard: '3-4 minutes (approximately 450-550 words)',
    premium: '5-6 minutes (approximately 650-800 words)',
    rush: '5-6 minutes (approximately 650-800 words)'
  };

  const prompt = `You are a professional roast and speech writer. Write a ${packageLengths[pkg] || packageLengths.standard} ${occasion || 'roast'} speech.

ABOUT THE HONOREE:
Name: ${honoree}
Relationship to speaker: ${relationship}
Event date: ${eventDate}
Audience: ${audience}

HEAT LEVEL: ${(heat || 'medium').toUpperCase()}
Instructions: ${heatInstructions[heat] || heatInstructions.medium}

MATERIAL TO USE:
${dirt}

OFF LIMITS:
${offLimits || 'Nothing specified'}

TONE PREFERENCES:
${tone || 'None specified'}

Write a complete, polished, ready-to-deliver speech. Make it feel personal, specific, and genuinely funny. Structure it well with a strong opening, middle, and closing. End on a warm note even if the rest is a roast.`;

  const requestBody = JSON.stringify({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1500,
    messages: [{ role: 'user', content: prompt }]
  });

  console.log('Calling Anthropic API...');
  console.log('API Key exists:', !!process.env.ANTHROPIC_KEY);

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
      console.log('API response status:', res.statusCode);
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        console.log('API response body:', body.substring(0, 200));
        try {
          const parsed = JSON.parse(body);
          const speech = parsed.content[0].text;
          console.log('Speech generated successfully');
          resolve({
            statusCode: 200,
            body: JSON.stringify({ speech })
          });
        } catch (err) {
          console.log('Parse error:', err.message);
          resolve({
            statusCode: 500,
            body: JSON.stringify({ error: 'Failed to parse response', raw: body })
          });
        }
      });
    });

    req.on('error', (err) => {
      console.log('Request error:', err.message);
      resolve({
        statusCode: 500,
        body: JSON.stringify({ error: err.message })
      });
    })

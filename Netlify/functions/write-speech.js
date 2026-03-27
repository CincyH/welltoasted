exports.handler = async function(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const data = JSON.parse(event.body);
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

  const prompt = `You are a professional roast and speech writer. Write a ${packageLengths[pkg]} ${occasion} speech.

ABOUT THE HONOREE:
Name: ${honoree}
Relationship to speaker: ${relationship}
Event date: ${eventDate}
Audience: ${audience}

HEAT LEVEL: ${heat.toUpperCase()}
Instructions: ${heatInstructions[heat]}

MATERIAL TO USE:
${dirt}

OFF LIMITS:
${offLimits || 'Nothing specified'}

TONE PREFERENCES:
${tone || 'None specified'}

Write a complete, polished, ready-to-deliver speech. Make it feel personal, specific, and genuinely funny. Structure it well with a strong opening, middle, and closing. End on a warm note even if the rest is a roast.`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1500,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    const result = await response.json();
    const speech = result.content[0].text;

    return {
      statusCode: 200,
      body: JSON.stringify({ speech })
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
};

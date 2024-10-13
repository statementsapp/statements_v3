import { NextApiRequest, NextApiResponse } from 'next';
import OpenAI from 'openai';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'OpenAI API key is not set' });
  }

  const openai = new OpenAI({ apiKey });

  try {
    console.log('Attempting to connect to OpenAI...');
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: "Hello, are you working?" }],
      max_tokens: 5
    });

    console.log('OpenAI Response:', JSON.stringify(response, null, 2));

    if (response.choices && response.choices.length > 0) {
      return res.status(200).json({ 
        success: true, 
        message: 'OpenAI API is working',
        response: response.choices[0].message.content 
      });
    } else {
      return res.status(500).json({ 
        success: false, 
        error: 'Unexpected response format from OpenAI' 
      });
    }
  } catch (error) {
    console.error('Error testing OpenAI:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Error connecting to OpenAI',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

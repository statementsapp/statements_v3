import { NextApiRequest, NextApiResponse } from 'next';
import { generateConstructiveCriticism } from '../../utils/openai';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    console.log("Received request");
    try {
      const { sentence } = req.body;
      if (!sentence) {
        console.log("Missing sentence in request body");
        return res.status(400).json({ error: 'Sentence is required' });
      }
      console.log("Sentence awaiting: ", sentence);
      const criticism = await generateConstructiveCriticism(sentence);
      console.log("Criticism:", criticism); // Fixed syntax error here
      res.status(200).json({ criticism });
    } catch (error) {
      console.error('Error in API route:', error);
      res.status(500).json({ error: 'Internal Server Error', details: error instanceof Error ? error.message : 'Unknown error' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}

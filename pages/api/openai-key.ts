import { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    res.status(200).json({ openaiKey: process.env.OPENAI_API_KEY });
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}

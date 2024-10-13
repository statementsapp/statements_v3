import OpenAI from 'openai';

let openaiInstance: OpenAI | null = null;

function getOpenAIInstance() {
  console.log("Getting OpenAI instance");
  if (!openaiInstance) {
    const apiKey = typeof window !== 'undefined' 
      ? (window as any).__NEXT_DATA__?.props?.pageProps?.openaiKey
      : process.env.OPENAI_API_KEY;

    console.log("API Key (masked):", apiKey ? `${apiKey.slice(0, 5)}...${apiKey.slice(-5)}` : 'Not found');

    if (!apiKey) {
      throw new Error('OpenAI API key is not available');
    }

    openaiInstance = new OpenAI({ apiKey });
  }
  return openaiInstance;
}

export async function generateConstructiveCriticism(sentence: string): Promise<string> {
  try {
    console.log("Attempting to generate criticism for:", sentence);
    const openai = getOpenAIInstance();
    console.log("OpenAI instance created successfully");

    console.log("Sending request to OpenAI API...");
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant that provides constructive criticism for sentences. Your feedback should be concise, specific, and aimed at improving the sentence."
        },
        {
          role: "user",
          content: `Please provide a brief constructive criticism for the following sentence: "${sentence}"`
        }
      ],
      max_tokens: 100,
    });
    console.log("Received response from OpenAI API");

    console.log("Full OpenAI API Response:", JSON.stringify(response, null, 2));

    if (response.choices && response.choices.length > 0 && response.choices[0].message) {
      const criticism = response.choices[0].message.content || "Unable to generate criticism.";
      console.log("Generated Criticism:", criticism);
      return criticism;
    } else {
      console.error("Unexpected response format from OpenAI:", response);
      return "Error: Unexpected response format from OpenAI.";
    }
  } catch (error) {
    console.error("Error generating constructive criticism:", error);
    if (error instanceof Error) {
      return `Error generating criticism: ${error.message}`;
    } else {
      return "Unknown error occurred while generating criticism.";
    }
  }
}

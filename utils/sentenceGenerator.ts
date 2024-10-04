export function generateRandomSentence(): string {
  const sentences = [
    "This is an interesting point.",
    "Could you elaborate on that?",
    "I'm not sure I agree with this.",
    "This reminds me of something I read recently.",
    "That's a novel perspective.",
    "How does this relate to the previous point?",
    "I'd like to know more about this.",
    "This seems to contradict what was said earlier.",
    "Can you provide an example?",
    "This is a crucial observation.",
  ];
  return sentences[Math.floor(Math.random() * sentences.length)];
}
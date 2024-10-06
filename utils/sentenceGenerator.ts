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
    "What evidence supports this claim?",
    "Have you considered alternative viewpoints?",
    "This aligns with my own experiences.",
    "I wonder about the broader implications of this.",
    "How does this fit into the larger context?",
    "This challenges my preconceptions.",
    "Are there any potential drawbacks to this approach?",
    "I find this particularly insightful.",
    "How might this apply in different scenarios?",
    "This raises some interesting questions.",
  ];
  return sentences[Math.floor(Math.random() * sentences.length)];
}
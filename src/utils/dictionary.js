// dictionary.js: Utility functions for dictionary lookups
// Placeholder – you can integrate a real dictionary API later
export async function lookupWord(word) {
  // Example: fetch from an API
  // const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`);
  // return response.json();

  // Mock response for now
  return {
    word,
    pronunciation: '/rɪˈdjuːs/',
    partOfSpeech: 'verb',
    definition: 'to make something smaller or less in amount, degree, or size',
    example: 'We should reduce the amount of waste we produce.',
  };
}
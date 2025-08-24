
export function parseSimpleAnswers(responseText: string, expectedAnswerCount: number): string[] {
  const lines = responseText
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0);

  const answers: string[] = [];

  for (let i = 0; i < expectedAnswerCount; i++) {
    if (i < lines.length) {
      let answer = lines[i];

      answer = answer.replace(/^(Answer\s*\d+\s*:?\s*)/i, '');
      answer = answer.replace(/^(\d+\.\s+)/i, '');
      answer = answer.replace(/^[-*]\s*/, '');

      if ((answer.startsWith('"') && answer.endsWith('"')) ||
          (answer.startsWith("'") && answer.endsWith("'"))) {
        answer = answer.slice(1, -1);
      }

      answers.push(answer.trim());
    } else {
      answers.push("NOT_FOUND");
    }
  }

  return answers;
}

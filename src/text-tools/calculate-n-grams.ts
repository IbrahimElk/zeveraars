export function nGramRepresentation(s: string, n: number): Array<string> {
  const result = [];
  let i = 0;

  while (i < s.length - (n - 1)) {
    let j = i;
    let temporary_result = '';
    while (temporary_result.length < n) {
      temporary_result += s[j];
      j++;
    }
    result.push(temporary_result);
    i++;
  }
  return result;
}

export function nGramCountingVector(s: string, n: number) {
  const result = new Map<string, number>();
  const Ngram_string = nGramRepresentation(s, n);
  for (const e of Ngram_string) {
    result.set(e, duplicates(e, Ngram_string));
  }
  return result;
}

function duplicates(s: string, a: string[]) {
  let counter = 0;
  for (const i of a) {
    if (i === s) {
      counter += 1;
    }
  }
  return counter;
}

// Guust Luyckx
// 22/04/2023

/**
 * this function decodes a string so it can be displayed in it original form
 * @param string the string that needs to be decoded
 * @returns the decoded string
 */

export function decodeHTMlInput(string: string): string {
  const entities: [string, string][] = [
    ['&amp', '&'],
    ['&lt', '<'],
    ['&gt', '>'],
    ['&quot', '"'],
    ['&#x27', "'"],
  ];

  let encoded_string: string = string;
  for (const [char, entity] of entities) {
    const regex = new RegExp(char, 'g');
    encoded_string = encoded_string.replace(regex, entity);
  }
  return encoded_string;
}

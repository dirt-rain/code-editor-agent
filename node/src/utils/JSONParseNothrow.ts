export function JSONParseNothrow(json: string) {
  try {
    return JSON.parse(json);
  } catch (err) {
    return undefined;
  }
}

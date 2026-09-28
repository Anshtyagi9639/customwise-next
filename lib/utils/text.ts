/** Lower-cases the first letter for use mid-sentence, unless the first word is an acronym (T1, TRACES, POAO). */
export function midSentence(label: string): string {
  const first = label.split(" ")[0] ?? "";
  if (/^[A-Z0-9&]{2,}$/.test(first)) return label;
  return label.charAt(0).toLowerCase() + label.slice(1);
}

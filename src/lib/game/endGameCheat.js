// ai generated: Both names must be exactly "end" after case normalization so ordinary names cannot end a round.
export function shouldEndGameByName(firstName, secondName) {
  return [firstName, secondName].every(name => typeof name === 'string' && name.trim().toLocaleLowerCase() === 'end');
}

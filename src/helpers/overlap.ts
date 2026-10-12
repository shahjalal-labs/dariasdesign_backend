export function toMinutes(time: string) {
  const match = time.match(/^(0?[1-9]|1[0-2]):([0-5][0-9]) (AM|PM)$/);

  if (!match) {
    throw new Error(`Invalid time format: ${time}`);
  }

  let hours = Number(match[1]);
  const minutes = Number(match[2]);
  const period = match[3];

  if (period === "AM") {
    hours = hours === 12 ? 0 : hours;
  } else {
    hours = hours === 12 ? 12 : hours + 12;
  }

  return hours * 60 + minutes;
}

export function isOverlap(
  newStart: string,
  newEnd: string,
  existingStart: string,
  existingEnd: string,
) {
  const nStart = toMinutes(newStart);
  const nEnd = toMinutes(newEnd);
  const eStart = toMinutes(existingStart);
  const eEnd = toMinutes(existingEnd);

  return nStart < eEnd && nEnd > eStart;
}

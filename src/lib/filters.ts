const RED_FLAGS = [
  "US only",
  "USA only",
  "North America",
  "must reside in",
  "citizenship required",
  "UK only",
  "Europe only",
  "EST timezone",
  "PST timezone",
  "CST timezone",
  "local candidates",
  "within the US",
  "Work from US",
  "Canada only",
  "LATAM",
  "EMEA only",
  "Germany only",
  "France only",
];

const GREEN_FLAGS = [
  "Worldwide",
  "Anywhere",
  "Global",
  "Distributed",
  "Work from anywhere",
  "No borders",
];

export function isWorldwide(title: string, company: string): boolean {
  const text = `${title} ${company}`.toLowerCase();

  // 1. Explicit Green Flags always pass
  const isExplicitlyGlobal = GREEN_FLAGS.some((flag) =>
    text.includes(flag.toLowerCase()),
  );
  if (isExplicitlyGlobal) return true;

  // 2. If it has a Red Flag, it's trash (returns false)
  const hasRedFlag = RED_FLAGS.some((flag) =>
    text.includes(flag.toLowerCase()),
  );
  if (hasRedFlag) return false;

  // 3. Default to true if no red flags are found (assuming niche remote sources are mostly global)
  return true;
}

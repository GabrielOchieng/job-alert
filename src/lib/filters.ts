// // src/lib/filters.ts

// const RED_FLAGS = [
//   "US only",
//   "USA only",
//   "North America",
//   "must reside in",
//   "citizenship required",
//   "UK only",
//   "Europe only",
//   "EST timezone",
//   "PST timezone",
//   "CST timezone",
//   "local candidates",
//   "within the US",
//   "Work from US",
//   "Canada only",
//   "LATAM",
//   "EMEA only",
//   "Germany only",
//   "France only",
// ];

// const GREEN_FLAGS = [
//   "Worldwide",
//   "Anywhere",
//   "Global",
//   "Distributed",
//   "Digital Nomad",
//   "Work from home",
//   "Distributed",
//   "Work from anywhere",
//   "No borders",
// ];

// export function isTrash(description: string, location: string): boolean {
//   const text = `${description} ${location}`.toLowerCase();

//   // 1. Check for hard Red Flags
//   const hasRedFlag = RED_FLAGS.some((flag) =>
//     text.includes(flag.toLowerCase()),
//   );

//   // 2. Check for explicit Green Flags (Worldwide overrides some red flags)
//   const isExplicitlyGlobal = GREEN_FLAGS.some((flag) =>
//     text.includes(flag.toLowerCase()),
//   );

//   // If it has a red flag and isn't explicitly global, it's trash.
//   return hasRedFlag && !isExplicitlyGlobal;
// }

// src/lib/filters.ts

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

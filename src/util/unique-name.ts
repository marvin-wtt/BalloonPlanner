type Person = { firstName: string; lastName: string };

export function makeUniqueNames<T extends Person>(
  people: T[],
): (T & { name: string })[] {
  // 1. Count occurrences of each firstName.
  const firstNameCounts = people.reduce<Record<string, number>>((cnt, p) => {
    cnt[p.firstName] = (cnt[p.firstName] || 0) + 1;
    return cnt;
  }, {});

  // 2. Group people by a duplicated firstName.
  const duplicateGroups = new Map<string, Person[]>();
  for (const p of people) {
    if ((firstNameCounts[p.firstName] ?? 0) > 1) {
      if (!duplicateGroups.has(p.firstName)) {
        duplicateGroups.set(p.firstName, []);
      }
      duplicateGroups.get(p.firstName)?.push(p);
    }
  }

  // 3. For each group, find the minimal prefix length that yields unique prefixes.
  const prefixLengths = new Map<string, number>();
  for (const [firstName, group] of duplicateGroups) {
    let len = 1;
    const maxLen = Math.max(...group.map((p) => p.lastName.length));
    while (len <= maxLen) {
      const seen = new Set<string>();
      let clash = false;
      for (const p of group) {
        const pre = p.lastName.slice(0, len).toUpperCase();
        if (seen.has(pre)) {
          clash = true;
          break;
        }
        seen.add(pre);
      }
      if (!clash) break;
      len++;
    }
    prefixLengths.set(firstName, len);
  }

  // 4. Build the display names.
  return people.map((p) => {
    // Unique firstName → just firstName
    if (firstNameCounts[p.firstName] === 1) {
      return {
        ...p,
        name: p.firstName,
      };
    }
    // Otherwise, take N letters of lastName (N from prefixLengths)
    const len = prefixLengths.get(p.firstName) ?? 0;
    const slice = p.lastName.slice(0, len);
    // If we've used the entire lastName, don't add a period
    const suffix = len < p.lastName.length ? '.' : '';
    return {
      ...p,
      name: `${p.firstName} ${slice}${suffix}`,
    };
  });
}

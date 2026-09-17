export const CHARACTER_SETS = {
  uppercase: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  lowercase: "abcdefghijklmnopqrstuvwxyz",
  numbers: "0123456789",
  symbols: "!@#$%^&*()-_=+[]{};:,.?/",
} as const;

export type CharacterType = keyof typeof CHARACTER_SETS;
export type PasswordOptions = Record<CharacterType, boolean> & {
  length: number;
  excludeSimilar: boolean;
};

export const DEFAULT_OPTIONS: PasswordOptions = {
  length: 20,
  uppercase: true,
  lowercase: true,
  numbers: true,
  symbols: true,
  excludeSimilar: false,
};
export const SIMILAR_CHARACTERS = "iIlLoO01|";
export const CHARACTER_TYPES = Object.keys(CHARACTER_SETS) as CharacterType[];

export function getCharacterGroups(options: PasswordOptions): string[] {
  if (
    !Number.isInteger(options.length) ||
    options.length < 6 ||
    options.length > 64
  ) {
    throw new RangeError("Choose a whole-number length from 6 to 64.");
  }
  if (
    [...CHARACTER_TYPES, "excludeSimilar" as const].some(
      (key) => typeof options[key] !== "boolean",
    )
  ) {
    throw new TypeError("Character settings must be true or false.");
  }
  const groups = CHARACTER_TYPES.filter((key) => options[key]).map((key) =>
    [...CHARACTER_SETS[key]]
      .filter(
        (character) =>
          !options.excludeSimilar || !SIMILAR_CHARACTERS.includes(character),
      )
      .join(""),
  );
  if (!groups.length)
    throw new Error("Keep at least one character type selected.");
  return groups;
}

// Discard the incomplete remainder of the uint32 range to avoid modulo bias.
export function secureRandomIndex(size: number): number {
  if (!Number.isInteger(size) || size < 1 || size > 0x100000000) {
    throw new RangeError("Invalid random range.");
  }
  if (!globalThis.crypto?.getRandomValues) {
    throw new Error("Secure randomness is unavailable. Try a current browser.");
  }
  const limit = Math.floor(0x100000000 / size) * size;
  const buffer = new Uint32Array(1);
  do {
    globalThis.crypto.getRandomValues(buffer);
  } while (buffer[0] >= limit);
  return buffer[0] % size;
}

export function generatePassword(options: PasswordOptions): string {
  const groups = getCharacterGroups(options);
  const alphabet = groups.join("");
  // Reject whole candidates missing a selected group. This preserves a uniform
  // distribution over all valid strings, unlike inserting mandatory characters.
  for (;;) {
    const candidate = Array.from(
      { length: options.length },
      () => alphabet[secureRandomIndex(alphabet.length)],
    ).join("");
    if (
      groups.every((group) =>
        [...candidate].some((character) => group.includes(character)),
      )
    )
      return candidate;
  }
}

export type StrengthLabel = "Weak" | "Medium" | "Strong" | "Ultimate";
export type PasswordStrength = {
  bits: number;
  label: StrengthLabel;
  percent: number;
  color: string;
};

export function getPasswordStrength(
  options: PasswordOptions,
): PasswordStrength {
  const groups = getCharacterGroups(options);
  const total = groups.join("").length;
  // Inclusion–exclusion counts only strings containing every enabled group.
  let possibilities = 0n;
  for (let mask = 0; mask < 1 << groups.length; mask++) {
    let omitted = 0;
    let count = 0;
    groups.forEach((group, index) => {
      if (mask & (1 << index)) {
        omitted += group.length;
        count++;
      }
    });
    const term = BigInt(total - omitted) ** BigInt(options.length);
    possibilities += count % 2 ? -term : term;
  }
  const bits = Math.log2(Number(possibilities));
  const label: StrengthLabel =
    bits < 50
      ? "Weak"
      : bits < 80
        ? "Medium"
        : bits < 128
          ? "Strong"
          : "Ultimate";
  const colors: Record<StrengthLabel, string> = {
    Weak: "#b74336",
    Medium: "#9a650c",
    Strong: "#27704d",
    Ultimate: "#2558df",
  };
  return {
    bits: Math.floor(bits),
    label,
    percent: Math.min(100, (bits / 128) * 100),
    color: colors[label],
  };
}

import { test, mock } from "node:test";
import assert from "node:assert/strict";
import {
  CHARACTER_SETS,
  CHARACTER_TYPES,
  DEFAULT_OPTIONS,
  SIMILAR_CHARACTERS,
  generatePassword,
  getPasswordStrength,
  secureRandomIndex,
  type PasswordOptions,
} from "../lib/password";

test("every character-type combination obeys minimum/maximum length and exclusion rules", () => {
  for (let mask = 1; mask < 16; mask++) {
    for (const length of [6, 64])
      for (const excludeSimilar of [false, true]) {
        const options = { ...DEFAULT_OPTIONS, length, excludeSimilar };
        CHARACTER_TYPES.forEach((key, index) => {
          options[key] = Boolean(mask & (1 << index));
        });
        const allowed = CHARACTER_TYPES.filter((key) => options[key])
          .map((key) => CHARACTER_SETS[key])
          .join("");
        for (let sample = 0; sample < 10; sample++) {
          const password = generatePassword(options);
          assert.equal(password.length, length);
          assert.ok(
            [...password].every((character) => allowed.includes(character)),
          );
          for (const key of CHARACTER_TYPES.filter((key) => options[key])) {
            assert.ok(
              [...password].some((character) =>
                CHARACTER_SETS[key].includes(character),
              ),
              `Missing ${key}`,
            );
          }
          if (excludeSimilar)
            assert.ok(
              [...password].every(
                (character) => !SIMILAR_CHARACTERS.includes(character),
              ),
            );
        }
      }
  }
});

test("rejects invalid lengths, malformed settings, and empty alphabets", () => {
  for (const length of [5, 65, 6.5, NaN, Infinity])
    assert.throws(() => generatePassword({ ...DEFAULT_OPTIONS, length }));
  assert.throws(() =>
    generatePassword({
      ...DEFAULT_OPTIONS,
      uppercase: false,
      lowercase: false,
      numbers: false,
      symbols: false,
    }),
  );
  assert.throws(() =>
    generatePassword({
      ...DEFAULT_OPTIONS,
      uppercase: "yes",
    } as unknown as PasswordOptions),
  );
});

test("strength accounts for enabled character types and covers all four labels", () => {
  const numeric = {
    ...DEFAULT_OPTIONS,
    uppercase: false,
    lowercase: false,
    symbols: false,
  };
  assert.deepEqual(
    getPasswordStrength({ ...numeric, length: 6 }).bits,
    Math.floor(Math.log2(10 ** 6)),
  );
  assert.equal(getPasswordStrength({ ...numeric, length: 6 }).label, "Weak");
  assert.equal(getPasswordStrength({ ...numeric, length: 16 }).label, "Medium");
  assert.equal(
    getPasswordStrength({ ...DEFAULT_OPTIONS, length: 14 }).label,
    "Strong",
  );
  assert.equal(getPasswordStrength(DEFAULT_OPTIONS).label, "Ultimate");
  const options = {
    ...DEFAULT_OPTIONS,
    length: 6,
    lowercase: false,
    symbols: false,
  };
  assert.equal(
    getPasswordStrength(options).bits,
    Math.floor(Math.log2(36 ** 6 - 26 ** 6 - 10 ** 6)),
  );
  assert.ok(
    getPasswordStrength({ ...DEFAULT_OPTIONS, excludeSimilar: true }).bits <
      getPasswordStrength(DEFAULT_OPTIONS).bits,
  );
  assert.ok(
    Number.isFinite(
      getPasswordStrength({ ...DEFAULT_OPTIONS, length: 64 }).bits,
    ),
  );
});

test("random indexing rejects the biased tail of the uint32 range", () => {
  let calls = 0;
  const replacement = mock.method(
    globalThis.crypto,
    "getRandomValues",
    (array: Uint32Array) => {
      array[0] = calls++ === 0 ? 0xffffffff : 19;
      return array;
    },
  );
  try {
    assert.equal(secureRandomIndex(10), 9);
    assert.equal(calls, 2);
  } finally {
    replacement.mock.restore();
  }
});

test("random generation fails closed when the cryptographic source fails", () => {
  const replacement = mock.method(globalThis.crypto, "getRandomValues", () => {
    throw new Error("Random source unavailable");
  });
  try {
    assert.throws(
      () => generatePassword(DEFAULT_OPTIONS),
      /Random source unavailable/,
    );
  } finally {
    replacement.mock.restore();
  }
});

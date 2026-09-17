"use client";

export function PasswordText({ value }: { value: string }) {
  return (
    <>
      {[...value].map((character, index) => (
        <span
          key={index}
          className={
            /[0-9]/.test(character)
              ? "character-number"
              : /[^a-zA-Z0-9]/.test(character)
                ? "character-symbol"
                : undefined
          }
        >
          {character}
        </span>
      ))}
    </>
  );
}

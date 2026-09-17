export async function copyText(value: string): Promise<void> {
  if (!value) throw new Error("There is no password to copy.");
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(value);
      return;
    } catch {
      /* Try the user-initiated copy fallback for older browsers. */
    }
  }
  const previousFocus =
    document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;
  const selection = document.getSelection();
  const ranges = selection
    ? Array.from({ length: selection.rangeCount }, (_, index) =>
        selection.getRangeAt(index).cloneRange(),
      )
    : [];
  const field = document.createElement("textarea");
  field.value = value;
  field.readOnly = true;
  field.style.cssText =
    "position:fixed;left:-9999px;top:0;opacity:0;font-size:16px;";
  field.setAttribute("aria-label", "Password to copy");
  document.body.appendChild(field);
  try {
    field.select();
    field.setSelectionRange(0, value.length);
    if (!document.execCommand("copy"))
      throw new Error("Clipboard access was blocked.");
  } finally {
    field.value = "";
    field.remove();
    previousFocus?.focus({ preventScroll: true });
    if (selection) {
      selection.removeAllRanges();
      ranges.forEach((range) => selection.addRange(range));
    }
  }
}

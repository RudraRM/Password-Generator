import { after, afterEach, test } from "node:test";
import assert from "node:assert/strict";
import { JSDOM } from "jsdom";

// Component tests run in an in-memory DOM without visiting a website.
const dom = new JSDOM("<!doctype html><html><body></body></html>", {
  url: "https://keyform.test",
  pretendToBeVisual: true,
});
Object.assign(globalThis, {
  window: dom.window,
  self: dom.window,
  document: dom.window.document,
  HTMLElement: dom.window.HTMLElement,
  SVGElement: dom.window.SVGElement,
  Element: dom.window.Element,
  getComputedStyle: dom.window.getComputedStyle.bind(dom.window),
  requestAnimationFrame: dom.window.requestAnimationFrame.bind(dom.window),
  cancelAnimationFrame: dom.window.cancelAnimationFrame.bind(dom.window),
});
Object.defineProperty(globalThis, "navigator", {
  configurable: true,
  value: dom.window.navigator,
});
Object.defineProperty(dom.window, "matchMedia", {
  value: (query: string) => ({
    matches: query.includes("prefers-reduced-motion"),
    media: query,
    addListener() {},
    removeListener() {},
    addEventListener() {},
    removeEventListener() {},
  }),
});

const { render, fireEvent, screen, waitFor, cleanup, act } = await import(
  "@testing-library/react"
);
const { Generator } = await import("../components/Generator");
const { CopyButton } = await import("../components/CopyButton");
const { SIMILAR_CHARACTERS } = await import("../lib/password");
afterEach(() => cleanup());
after(() => {
  cleanup();
  dom.window.close();
});

test("workspace initializes, regenerates, changes length, excludes similar characters and protects the last type", async () => {
  render(<Generator />);
  await waitFor(() =>
    assert.equal(
      screen.getByLabelText("Generated password").textContent?.length,
      20,
    ),
  );
  const initial = screen.getByLabelText("Generated password").textContent;
  fireEvent.click(
    screen.getByRole("button", { name: "Generate new password" }),
  );
  await waitFor(() =>
    assert.notEqual(
      screen.getByLabelText("Generated password").textContent,
      initial,
    ),
  );
  fireEvent.change(screen.getByRole("slider"), { target: { value: "64" } });
  await waitFor(() =>
    assert.equal(
      screen.getByLabelText("Generated password").textContent?.length,
      64,
    ),
  );
  fireEvent.click(screen.getByRole("switch"));
  await waitFor(() =>
    assert.ok(
      [...screen.getByLabelText("Generated password").textContent!].every(
        (character) => !SIMILAR_CHARACTERS.includes(character),
      ),
    ),
  );
  for (const name of [/Uppercase/, /Lowercase/, /Symbols/])
    fireEvent.click(screen.getByRole("checkbox", { name }));
  const last = screen.getByRole("checkbox", {
    name: /Numbers/,
  }) as HTMLInputElement;
  assert.equal(last.checked, true);
  assert.equal(last.disabled, true);
  fireEvent.change(screen.getByRole("slider"), { target: { value: "6" } });
  await waitFor(() =>
    assert.match(
      screen.getByLabelText("Generated password").textContent!,
      /^[2-9]{6}$/,
    ),
  );
  assert.match(
    screen.getByRole("meter").getAttribute("aria-valuetext")!,
    /^Weak/,
  );
  cleanup();
});

test("copy writes the exact value, acknowledges success and resets on a new password", async () => {
  let copied = "";
  Object.defineProperty(navigator, "clipboard", {
    configurable: true,
    value: {
      writeText: async (value: string) => {
        copied = value;
      },
    },
  });
  const view = render(<CopyButton value="test-only-A2!" />);
  fireEvent.click(screen.getByRole("button", { name: "Copy password" }));
  await waitFor(() =>
    assert.ok(screen.getByRole("button", { name: "Password copied" })),
  );
  assert.equal(copied, "test-only-A2!");
  view.rerender(<CopyButton value="test-only-B3@" />);
  assert.ok(screen.getByRole("button", { name: "Copy password" }));
  cleanup();
});

test("a late clipboard completion cannot mark a replacement password as copied", async () => {
  let finish: (() => void) | undefined;
  Object.defineProperty(navigator, "clipboard", {
    configurable: true,
    value: {
      writeText: () =>
        new Promise<void>((resolve) => {
          finish = resolve;
        }),
    },
  });
  const view = render(<CopyButton value="test-only-A2!" />);
  fireEvent.click(screen.getByRole("button", { name: "Copy password" }));
  view.rerender(<CopyButton value="test-only-B3@" />);
  await act(async () => {
    finish?.();
  });
  assert.ok(screen.getByRole("button", { name: "Copy password" }));
  cleanup();
});

test("clipboard failures provide manual-copy guidance and do not report success", async () => {
  Object.defineProperty(navigator, "clipboard", {
    configurable: true,
    value: {
      writeText: async () => {
        throw new Error("Denied");
      },
    },
  });
  Object.defineProperty(document, "execCommand", {
    configurable: true,
    value: () => false,
  });
  render(<CopyButton value="test-only-A2!" />);
  fireEvent.click(screen.getByRole("button", { name: "Copy password" }));
  await waitFor(() =>
    assert.match(screen.getByRole("alert").textContent!, /copy it manually/),
  );
  assert.equal(document.querySelectorAll("textarea").length, 0);
  assert.ok(screen.getByRole("button", { name: "Copy password" }));
  cleanup();
});

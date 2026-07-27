#!/usr/bin/env node
/**
 * TUI Component Preview - Shows actual rendered components
 */
import { TUI, ProcessTerminal, Container, Text, SelectList, Spacer, Box } from "@earendil-works/pi-tui";

const theme = {
  fg: (c, t) => ({ accent: "\x1b[35m", muted: "\x1b[90m", dim: "\x1b[2m", warning: "\x1b[33m", success: "\x1b[32m" }[c] || "") + t + "\x1b[0m",
  bold: (t) => `\x1b[1m${t}\x1b[0m`,
};

console.clear();
console.log(theme.bold("\nTUI Component Preview\n"));
console.log("This shows actual Pi TUI components with real rendering.\n");
console.log("Choose a preview:\n");
console.log("  1. Work Selector");
console.log("  2. Complexity Router");
console.log("  3. Activation Banner\n");

const choice = process.argv[2] || "1";

const terminal = new ProcessTerminal();
const tui = new TUI(terminal, false);
const root = new Container();

if (choice === "1") {
  root.addChild(new Text(theme.bold("Work Selector Component"), 0, 0));
  root.addChild(new Spacer(1));
  
  const items = [
    { value: "1", label: "feat: OAuth authentication flow", description: "[P0] Issues" },
    { value: "2", label: "fix: API rate limit exhaustion", description: "[P1] Issues" },
    { value: "3", label: "#123: Refactor middleware layer", description: "[⚠️ CI] PRs" },
    { value: "4", label: "Review: Infrastructure changes", description: "[👁️] PRs" },
    { value: "5", label: "Document deployment process", description: "[📝] ToDo" },
  ];
  
  root.addChild(new SelectList(items, 10, {
    selectedPrefix: (s) => theme.fg("accent", "❯ "),
    selectedText: (s) => theme.fg("accent", theme.bold(s)),
    description: (s) => theme.fg("muted", s),
  }));
  
  root.addChild(new Spacer(1));
  root.addChild(new Text(theme.fg("dim", "↑↓ navigate • enter select • esc cancel"), 0, 0));
  
} else if (choice === "2") {
  root.addChild(new Text(theme.bold("Complexity Assessment Component"), 0, 0));
  root.addChild(new Spacer(1));
  root.addChild(new Text(theme.fg("muted", "Selected: ") + "feat: OAuth authentication flow", 0, 0));
  root.addChild(new Spacer(1));
  root.addChild(new Text(theme.fg("warning", "This looks like a complex feature:"), 0, 0));
  
  ["• New system component", "• Multiple integration points", "• Security considerations"].forEach(line => 
    root.addChild(new Text("  " + line, 0, 0))
  );
  
  root.addChild(new Spacer(1));
  root.addChild(new Text(theme.fg("accent", "Recommendation: ") + "Start with design doc", 0, 0));
  root.addChild(new Spacer(1));
  
  root.addChild(new SelectList([
    { value: "yes", label: "Yes - /design-doc OAuth", description: "" },
    { value: "no", label: "No - proceed with Understand", description: "" },
    { value: "cancel", label: "Cancel - back to work items", description: "" },
  ], 5, {
    selectedPrefix: (s) => theme.fg("accent", "❯ "),
    selectedText: (s) => theme.fg("accent", theme.bold(s)),
  }));
  
  root.addChild(new Spacer(1));
  root.addChild(new Text(theme.fg("dim", "↑↓ navigate • enter select • esc cancel"), 0, 0));
  
} else if (choice === "3") {
  root.addChild(new Text(theme.bold("Activation Banner Component"), 0, 0));
  root.addChild(new Spacer(1));
  
  root.addChild(new Box([
    theme.fg("accent", "●") + " " + theme.bold("PATCHANI") + " " + theme.fg("dim", "—") + " Synced 5 work items"
  ]));
  
  root.addChild(new Spacer(1));
  
  [
    theme.fg("success", "✓") + " GitHub Issues: 2",
    theme.fg("success", "✓") + " Pull Requests: 2",
    theme.fg("success", "✓") + " Patchani ToDo: 1",
  ].forEach(line => root.addChild(new Text(line, 0, 0)));
  
  root.addChild(new Spacer(1));
  root.addChild(new Text(theme.fg("dim", "Ready to work. Type your request or select from work items."), 0, 0));
}

root.addChild(new Spacer(2));
root.addChild(new Text(theme.fg("dim", "Press q to quit"), 0, 0));

tui.addChild(root);
tui.requestRender();

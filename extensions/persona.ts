/**
 * Patchani Persona Extension
 * 
 * Activates Patchani persona on session start.
 * Injects system prompt from persona/patchani.md.
 */

import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import chalk from "chalk";

export default function (pi: ExtensionAPI) {
  
  let personaActive = false;
  let personaContent = "";
  
  // Load persona from persona/patchani.md
  function loadPersona(cwd: string): string {
    const personaPath = join(cwd, "persona", "patchani.md");
    
    if (existsSync(personaPath)) {
      return readFileSync(personaPath, "utf-8");
    }
    
    // Fallback: try package location
    const packagePersonaPath = join(__dirname, "..", "persona", "patchani.md");
    if (existsSync(packagePersonaPath)) {
      return readFileSync(packagePersonaPath, "utf-8");
    }
    
    return "";
  }
  
  // Inject persona into system prompt
  pi.on("before_agent_start", async (event, ctx) => {
    if (!personaActive) return;
    
    if (!personaContent) {
      personaContent = loadPersona(ctx.cwd);
    }
    
    if (personaContent) {
      return {
        systemPrompt: event.systemPrompt + "\n\n## Patchani Persona\n\n" + personaContent
      };
    }
  });
  
  // Activate on session start
  pi.on("session_start", async (event, ctx) => {
    personaContent = loadPersona(ctx.cwd);
    
    if (personaContent) {
      personaActive = true;
      
      // Show welcome screen in TUI mode only
      if (ctx.mode === "tui") {
        const { Text, Box } = await import("@earendil-works/pi-tui");
        
        await ctx.ui.custom((tui) => {
          const width = 60;
          const lines = [
            "",
            chalk.bold.cyan("  PATCHANI"),
            "",
            chalk.dim("  Engineering Assistant for Pi Dev"),
            "",
            chalk.dim("  \u2022 Design documents with research workflows"),
            chalk.dim("  \u2022 GitHub \u2192 Apple Reminders sync"),
            chalk.dim("  \u2022 Structured planning & execution"),
            "",
            chalk.dim.italic("  Press any key to continue..."),
            ""
          ];
          
          const content = lines.join("\n");
          const text = new Text(content, 0, 0);
          const box = new Box(
            text,
            { border: "rounded", borderColor: "cyan", title: " Welcome ", titleColor: "cyan" },
            width,
            lines.length + 2
          );
          
          return {
            render: () => box,
            handleKey: () => {
              return { close: true };
            }
          };
        });
      } else {
        // Simple console banner for non-TUI modes
        console.log(chalk.cyan("\nPATCHANI") + chalk.dim(" - Engineering Assistant for Pi Dev\n"));
      }
      
      ctx.ui.notify("Persona active", "info");
    } else {
      ctx.ui.notify("Patchani persona file not found", "warning");
    }
  });
  
  // Command: Manually activate persona
  pi.registerCommand("patchani", {
    description: "Activate Patchani persona",
    handler: async (_args, ctx) => {
      personaContent = loadPersona(ctx.cwd);
      
      if (personaContent) {
        personaActive = true;
        ctx.ui.notify("Patchani persona activated", "info");
      } else {
        ctx.ui.notify("Patchani persona file not found - install @setarm01/patchani package", "error");
      }
    }
  });
  
  // Command: Deactivate persona
  pi.registerCommand("patchani-off", {
    description: "Deactivate Patchani persona",
    handler: async (_args, ctx) => {
      personaActive = false;
      ctx.ui.notify("Patchani persona deactivated", "info");
    }
  });
}

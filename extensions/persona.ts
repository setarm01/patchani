/**
 * Patchani Persona Extension
 * 
 * Activates Patchani persona on session start.
 * Injects system prompt from persona/patchani.md.
 * Integrates TUI components for workflow management.
 */

import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

// Work item structure for compatibility with work-selector
interface WorkItem {
  id: string;
  title: string;
  type: "Issues" | "Tasks" | "PRs" | "Patchani ToDo";
  url?: string;
  priority?: string;
  completed?: boolean;
}


export default function (pi: ExtensionAPI) {
  
  let personaActive = false;
  let personaContent = "";
  let syncStatus = { syncing: true, itemCount: 0 };
  let widgetUpdateTrigger = 0;
  
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
  
  // Helper: Parse AppleScript reminders output into WorkItem array
  async function fetchReminders(ctx: any): Promise<WorkItem[]> {
    const workItems: WorkItem[] = [];
    
    const LISTS = [
      { name: "Issues", type: "Issues" as const },
      { name: "Tasks", type: "Tasks" as const },
      { name: "PRs", type: "PRs" as const },
      { name: "Patchani ToDo", type: "Patchani ToDo" as const }
    ];
    
    for (const list of LISTS) {
      try {
        const script = `
tell application "Reminders"
  if not (exists list "${list.name}") then
    return ""
  end if
  set output to ""
  repeat with r in (reminders of list "${list.name}")
    set output to output & id of r & "|" & name of r & "|" & body of r & "|" & completed of r & "\\n"
  end repeat
  return output
end tell
`;
        
        const result = await pi.exec("osascript", ["-e", script], { cwd: ctx.cwd });
        
        if (result.code === 0 && result.stdout.trim()) {
          const lines = result.stdout.trim().split('\n').filter(Boolean);
          
          for (const line of lines) {
            const [id, title, body, completed] = line.split('|');
            const urlMatch = body?.match(/https:\/\/github\.com\/[^\s]+/);
            
            workItems.push({
              id: id || `${list.type}-${workItems.length}`,
              title: title || "Untitled",
              type: list.type,
              url: urlMatch ? urlMatch[0] : undefined,
              completed: completed === 'true',
              priority: 'medium' // Could be enhanced to parse from body
            });
          }
        }
      } catch (err) {
        // Silently continue if a list fails to load
        console.error(`Failed to fetch ${list.name}:`, err);
      }
    }
    
    return workItems.filter(item => !item.completed); // Only show incomplete items
  }
  
  // Helper: Extract topic from work item for design_doc_start
  function extractTopic(workItem: string | WorkItem): string {
    if (typeof workItem === 'string') {
      return workItem;
    }
    return workItem.title;
  }
  
  // Activate on session start
  pi.on("session_start", async (event, ctx) => {
    personaContent = loadPersona(ctx.cwd);
    
    if (!personaContent) {
      ctx.ui.notify("Patchani persona file not found", "warning");
      return;
    }
    
    personaActive = true;
    
    // Add activation banner
    ctx.ui.setWidget("patchani-status", (_tui, theme) => ({
      render: () => {
        // Force re-render by reading widgetUpdateTrigger
        const _trigger = widgetUpdateTrigger;
        
        if (syncStatus.syncing) {
          return [
            `${theme.fg("dim", "●")} ${theme.fg("accent", "PATCHANI")} ${theme.fg("dim", "— Syncing GitHub...")}`
          ];
        } else {
          return [
            `${theme.fg("dim", "●")} ${theme.fg("accent", "PATCHANI")} ${theme.fg("dim", `— Synced ${syncStatus.itemCount} items`)}`
          ];
        }
      },
      invalidate: () => {}
    }), { placement: "aboveEditor" });
    
    // Simple console banner
    console.log("\n\x1b[36mPATCHANI\x1b[0m\x1b[2m - Engineering Assistant\x1b[0m\n");
    
    // Check if in a git repo
    const isGitRepo = existsSync(join(ctx.cwd, ".git"));
    
    if (!isGitRepo) {
      ctx.ui.notify("Patchani persona active (not in git repo)", "info");
      syncStatus.syncing = false;
      widgetUpdateTrigger++;
      return;
    }
    
    // Git repo detected - proceed with full activation flow
    // Note: Actual GitHub sync happens via standup_sync tool (manually or via workflow)
    // Here we just fetch existing reminders and show the selector
    
    // Non-blocking async flow
    (async () => {
      try {
        // Simulated delay for "Syncing" banner effect
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Fetch reminders to count items
        const workItems = await fetchReminders(ctx);
        syncStatus.itemCount = workItems.length;
        syncStatus.syncing = false;
        widgetUpdateTrigger++;
        
        if (workItems.length === 0) {
          ctx.ui.notify("No work items found - use /standup to sync", "info");
          return;
        }
        
        // Step 1: Show work selector
        const { showWorkSelector } = await import("./work-selector");
        const selectedItemId = await showWorkSelector(ctx, workItems);
        
        if (!selectedItemId) {
          // User cancelled selector
          ctx.ui.notify("Patchani ready - type your request", "info");
          return;
        }
        
        // Find the selected work item
        const selectedItem = workItems.find(item => item.id === selectedItemId);
        
        if (!selectedItem) {
          ctx.ui.notify("Selected item not found", "error");
          return;
        }
        
        // Step 2: Assess complexity and route
        const { assessComplexity } = await import("./complexity-router");
        const decision = await assessComplexity(ctx, {
          label: selectedItem.title,
          value: selectedItem.id,
          description: selectedItem.url || ""
        });
        
        if (!decision || decision === "cancel") {
          // User cancelled or went back - return to selector
          ctx.ui.notify("Cancelled - Patchani ready", "info");
          return;
        }
        
        // Step 3: Route based on decision
        if (decision === "design-doc") {
          const topic = extractTopic(selectedItem);
          ctx.ui.notify(`Starting design doc for: ${topic}`, "info");
          // Note: User should then manually invoke /design-doc or the agent will suggest it
        } else if (decision === "proceed") {
          ctx.ui.notify(`Starting work on: ${selectedItem.title}`, "info");
          // Workflow proceeds with selected item in context
        }
        
      } catch (err: any) {
        syncStatus.syncing = false;
        syncStatus.itemCount = 0;
        widgetUpdateTrigger++;
        
        const errorMsg = err?.message || String(err);
        ctx.ui.notify(`Activation error: ${errorMsg}`, "error");
        console.error("Patchani activation error:", err);
      }
    })();
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

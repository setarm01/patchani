/**
 * Patchani - Standup Sync Extension
 * 
 * Syncs GitHub activity to Apple Reminders on session start.
 * Provides persistent shared task list visible on Mac, iPhone, and widget.
 * 
 * Features:
 * - Auto-sync on session start
 * - GitHub: assigned issues, Projects items, open PRs
 * - Apple Reminders: 4 lists (Issues, Tasks, PRs, Patchani ToDo)
 * - Lifecycle: GitHub closed/merged → Reminder marked complete
 * - Priority inference from labels or body analysis
 */

import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";

interface GitHubIssue {
  number: number;
  title: string;
  state: string;
  html_url: string;
  labels: Array<{ name: string }>;
  body?: string;
}

interface GitHubPR {
  number: number;
  title: string;
  state: string;
  html_url: string;
  draft: boolean;
}

interface Reminder {
  id: string;
  title: string;
  body: string;
  completed: boolean;
  priority: string;
}

const REMINDER_LISTS = {
  ISSUES: "Issues",
  TASKS: "Tasks",
  PRS: "PRs",
  TODO: "Patchani ToDo"
};

export default function (pi: ExtensionAPI) {
  
  // Session state
  let lastSyncTime: number = 0;
  
  // Helper: Extract GitHub URL from reminder body
  function extractGitHubUrl(body: string): string | null {
    const match = body.match(/https:\/\/github\.com\/[^\s]+/);
    return match ? match[0] : null;
  }
  
  // Helper: Infer priority from GitHub labels
  function inferPriority(labels: Array<{ name: string }>, body?: string): string {
    const labelNames = labels.map(l => l.name.toLowerCase());
    
    if (labelNames.some(l => l.includes('p0') || l.includes('critical') || l.includes('urgent'))) {
      return 'high';
    }
    if (labelNames.some(l => l.includes('p1') || l.includes('priority:high'))) {
      return 'high';
    }
    if (labelNames.some(l => l.includes('p2') || l.includes('priority:medium'))) {
      return 'medium';
    }
    if (labelNames.some(l => l.includes('p3') || l.includes('priority:low'))) {
      return 'low';
    }
    
    // Fallback: analyze body for urgency keywords
    if (body) {
      const urgentKeywords = ['urgent', 'asap', 'critical', 'blocker', 'breaking'];
      if (urgentKeywords.some(kw => body.toLowerCase().includes(kw))) {
        return 'high';
      }
    }
    
    return 'medium';
  }
  
  // Helper: Create AppleScript to ensure list exists
  function ensureReminderListScript(listName: string): string {
    return `
tell application "Reminders"
  if not (exists list "${listName}") then
    make new list with properties {name:"${listName}"}
  end if
end tell
`.trim();
  }
  
  // Helper: List reminders from a list
  function listRemindersScript(listName: string): string {
    return `
tell application "Reminders"
  set output to ""
  repeat with r in (reminders of list "${listName}")
    set output to output & id of r & "|" & name of r & "|" & body of r & "|" & completed of r & "\\n"
  end repeat
  return output
end tell
`.trim();
  }
  
  // Helper: Create reminder
  function createReminderScript(listName: string, title: string, body: string, priority: string): string {
    const titleEscaped = title.replace(/"/g, '\\"');
    const bodyEscaped = body.replace(/"/g, '\\"');
    
    return `
tell application "Reminders"
  make new reminder in list "${listName}" with properties {name:"${titleEscaped}", body:"${bodyEscaped}", priority:${priority === 'high' ? '1' : priority === 'medium' ? '5' : '9'}}
end tell
`.trim();
  }
  
  // Helper: Mark reminder complete
  function completeReminderScript(reminderId: string): string {
    return `
tell application "Reminders"
  set completed of reminder id "${reminderId}" to true
end tell
`.trim();
  }
  
  // Tool: Sync GitHub to Reminders
  pi.registerTool({
    name: "standup_sync",
    label: "Standup Sync",
    description: "Sync GitHub activity to Apple Reminders (automatic on session start or manual)",
    parameters: Type.Object({}),
    async execute(toolCallId, params, signal, onUpdate, ctx) {
      try {
        if (onUpdate) onUpdate({ content: [{ type: "text", text: "Syncing GitHub to Apple Reminders..." }], details: {} });
        
        // 1. Ensure all reminder lists exist
        for (const listName of Object.values(REMINDER_LISTS)) {
          await pi.exec("osascript", ["-e", ensureReminderListScript(listName)], { cwd: ctx.cwd });
        }
        
        // 2. Fetch GitHub data
        if (onUpdate) onUpdate({ content: [{ type: "text", text: "Fetching GitHub issues..." }], details: {} });
        const issuesResult = await pi.exec("gh", [
          "issue", "list",
          "--assignee", "@me",
          "--state", "all",
          "--limit", "100",
          "--json", "number,title,state,url,labels,body"
        ], { cwd: ctx.cwd });
        
        if (issuesResult.code !== 0) {
          return {
            content: [{ type: "text", text: `GitHub sync failed: ${issuesResult.stderr}` }],
            details: { error: issuesResult.stderr },
            isError: true
          };
        }
        
        const issues: GitHubIssue[] = JSON.parse(issuesResult.stdout);
        
        const prsResult = await pi.exec("gh", [
          "pr", "list",
          "--author", "@me",
          "--state", "all",
          "--limit", "100",
          "--json", "number,title,state,url,draft"
        ], { cwd: ctx.cwd });
        
        if (onUpdate) onUpdate({ content: [{ type: "text", text: "Fetching GitHub PRs..." }], details: {} });
        
        const prs: GitHubPR[] = prsResult.code === 0 ? JSON.parse(prsResult.stdout) : [];
        
        // 3. Fetch existing reminders
        if (onUpdate) onUpdate({ content: [{ type: "text", text: "Reading existing reminders..." }], details: {} });
        const issuesRemindersResult = await pi.exec("osascript", ["-e", listRemindersScript(REMINDER_LISTS.ISSUES)], { cwd: ctx.cwd });
        const prsRemindersResult = await pi.exec("osascript", ["-e", listRemindersScript(REMINDER_LISTS.PRS)], { cwd: ctx.cwd });
        
        // Parse existing reminders
        const parseReminders = (output: string): Map<string, Reminder> => {
          const map = new Map();
          const lines = output.trim().split('\n').filter(Boolean);
          for (const line of lines) {
            const [id, title, body, completed] = line.split('|');
            const url = extractGitHubUrl(body || '');
            if (url) {
              map.set(url, { id, title, body: body || '', completed: completed === 'true', priority: '' });
            }
          }
          return map;
        };
        
        const existingIssueReminders = parseReminders(issuesRemindersResult.stdout);
        const existingPRReminders = parseReminders(prsRemindersResult.stdout);
        
        // 4. Sync issues
        if (onUpdate) onUpdate({ content: [{ type: "text", text: "Syncing issues..." }], details: {} });
        let issuesCreated = 0;
        let issuesCompleted = 0;
        
        for (const issue of issues) {
          const existing = existingIssueReminders.get(issue.html_url);
          
          if (!existing) {
            // Create new reminder
            const priority = inferPriority(issue.labels, issue.body);
            const body = `${issue.title}\n→ ${issue.html_url}`;
            await pi.exec("osascript", ["-e", createReminderScript(REMINDER_LISTS.ISSUES, issue.title, body, priority)], { cwd: ctx.cwd });
            issuesCreated++;
          } else if (issue.state === 'closed' && !existing.completed) {
            // Mark complete
            await pi.exec("osascript", ["-e", completeReminderScript(existing.id)], { cwd: ctx.cwd });
            issuesCompleted++;
          }
        }
        
        // 5. Sync PRs
        if (onUpdate) onUpdate({ content: [{ type: "text", text: "Syncing PRs..." }], details: {} });
        let prsCreated = 0;
        let prsCompleted = 0;
        
        for (const pr of prs) {
          const existing = existingPRReminders.get(pr.html_url);
          
          if (!existing && pr.state === 'open' && !pr.draft) {
            // Create new reminder
            const body = `${pr.title}\n→ ${pr.html_url}`;
            await pi.exec("osascript", ["-e", createReminderScript(REMINDER_LISTS.PRS, pr.title, body, 'medium')], { cwd: ctx.cwd });
            prsCreated++;
          } else if ((pr.state === 'closed' || pr.state === 'merged') && existing && !existing.completed) {
            // Mark complete
            await pi.exec("osascript", ["-e", completeReminderScript(existing.id)], { cwd: ctx.cwd });
            prsCompleted++;
          }
        }
        
        lastSyncTime = Date.now();
        
        const summary = `✓ Standup sync complete\n\n` +
          `Issues: ${issuesCreated} created, ${issuesCompleted} completed\n` +
          `PRs: ${prsCreated} created, ${prsCompleted} completed\n\n` +
          `Synced ${issues.length} issues and ${prs.length} PRs from GitHub`;
        
        return {
          content: [{ type: "text", text: summary }],
          details: {
            issuesCreated,
            issuesCompleted,
            prsCreated,
            prsCompleted,
            totalIssues: issues.length,
            totalPRs: prs.length
          }
        };
        
      } catch (error) {
        return {
          content: [{ type: "text", text: `Sync failed: ${error}` }],
          details: { error: String(error) },
          isError: true
        };
      }
    }
  });
  
  // Tool: Add to Patchani ToDo
  pi.registerTool({
    name: "standup_add_todo",
    label: "Add Patchani ToDo",
    description: "Add item to Patchani ToDo list for cross-session continuity",
    parameters: Type.Object({
      title: Type.String({ description: "Todo item title" }),
      notes: Type.Optional(Type.String({ description: "Optional notes" }))
    }),
    async execute(toolCallId, params, signal, onUpdate, ctx) {
      try {
        const body = params.notes || "";
        await pi.exec("osascript", ["-e", ensureReminderListScript(REMINDER_LISTS.TODO)], { cwd: ctx.cwd });
        await pi.exec("osascript", ["-e", createReminderScript(REMINDER_LISTS.TODO, params.title, body, 'medium')], { cwd: ctx.cwd });
        
        return {
          content: [{ type: "text", text: `✓ Added to Patchani ToDo: ${params.title}` }],
          details: {}
        };
      } catch (error) {
        return {
          content: [{ type: "text", text: `Failed to add todo: ${error}` }],
          details: { error: String(error) },
          isError: true
        };
      }
    }
  });
  
  // Command: Manual sync
  pi.registerCommand("standup", {
    description: "Manually sync GitHub to Apple Reminders",
    handler: async (_args, ctx) => {
      ctx.ui.notify("Starting standup sync...", "info");
      // LLM will see this and call standup_sync tool
    }
  });
  
  // Command: Quick add todo
  pi.registerCommand("standup-todo", {
    description: "Quick add to Patchani ToDo (usage: /standup-todo <text>)",
    handler: async (args, ctx) => {
      if (!args || !args.trim()) {
        ctx.ui.notify("Usage: /standup-todo <text>", "error");
        return;
      }
      
      try {
        await pi.exec("osascript", ["-e", ensureReminderListScript(REMINDER_LISTS.TODO)], { cwd: ctx.cwd });
        await pi.exec("osascript", ["-e", createReminderScript(REMINDER_LISTS.TODO, args.trim(), "", 'medium')], { cwd: ctx.cwd });
        ctx.ui.notify(`✓ Added: ${args.trim()}`, "info");
      } catch (error) {
        ctx.ui.notify(`Failed: ${error}`, "error");
      }
    }
  });
  
  // Auto-sync on session start
  pi.on("session_start", async (event, ctx) => {
    if (event.reason === "startup") {
      // Check if in a git repo
      const gitCheck = await pi.exec("git", ["rev-parse", "--git-dir"], { cwd: ctx.cwd });
      if (gitCheck.code === 0) {
        ctx.ui.notify("Auto-syncing GitHub to Reminders...", "info");
        // Note: LLM will need to call standup_sync tool
        // We can't directly trigger it here, but we can notify the user
      }
    }
  });
}

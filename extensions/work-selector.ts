import type { ExtensionContext } from "@earendil-works/pi-coding-agent";
import { Container, SelectList, Text } from "@earendil-works/pi-tui";
import { DynamicBorder } from "@earendil-works/pi-coding-agent";

/**
 * Work item structure for selection
 */
interface WorkItem {
  id: string;
  title: string;
  type: "Issues" | "Tasks" | "PRs" | "Patchani ToDo";
  url?: string;
  priority?: string;
  completed?: boolean;
}

/**
 * SelectList item format
 */
interface SelectItem {
  value: string;
  label: string;
  description: string;
}

/**
 * Show work item selection overlay
 * 
 * @param ctx - Extension context
 * @param workItems - Array of work items to display
 * @returns Selected item value or null if cancelled
 */
export async function showWorkSelector(
  ctx: ExtensionContext,
  workItems: WorkItem[]
): Promise<string | null> {
  // Group items by type
  const grouped = groupWorkItems(workItems);
  
  // Format items for SelectList
  const items = formatSelectItems(grouped);

  if (items.length === 0) {
    ctx.ui.notify("No work items available", "info");
    return null;
  }

  // Show custom TUI overlay
  const result = await ctx.ui.custom<string | null>(
    (tui, theme, _kb, done) => {
      const container = new Container();

      // Add dynamic border
      container.addChild(new DynamicBorder((s: string) => theme.fg("accent", s)));

      // Title
      const title = new Text("What should we work on?", 1, 1);
      // Apply bold and center styling manually with theme
      title.setCustomBgFn((text) => theme.bold(text));
      container.addChild(title);

      // SelectList with themed options
      const list = new SelectList(items, 15, {
        selectedPrefix: (s: string) => theme.fg("accent", s),
        selectedText: (s: string) => theme.fg("accent", s),
        description: (s: string) => theme.fg("muted", s),
        scrollInfo: (s: string) => theme.fg("dim", s),
        noMatch: (s: string) => theme.fg("warning", s),
      });

      // Handle selection
      list.onSelect = (item) => {
        done(item.value);
      };

      // Handle cancel (ESC)
      list.onCancel = () => {
        done(null);
      };

      container.addChild(list);

      // Help text
      const help = new Text("↑↓ navigate • enter select • esc cancel", 1, 0);
      help.setCustomBgFn((text) => theme.fg("dim", text));
      container.addChild(help);

      return {
        render: (w) => container.render(w),
        invalidate: () => container.invalidate(),
        handleInput: (data) => {
          list.handleInput(data);
          tui.requestRender();
        },
      };
    },
    {
      overlay: true,
      overlayOptions: {
        width: "80%",
        anchor: "center",
      },
    }
  );

  return result;
}

/**
 * Group work items by type
 */
function groupWorkItems(workItems: WorkItem[]): Map<string, WorkItem[]> {
  const grouped = new Map<string, WorkItem[]>();
  
  const typeOrder = ["Issues", "Tasks", "PRs", "Patchani ToDo"];
  
  // Initialize groups
  for (const type of typeOrder) {
    grouped.set(type, []);
  }
  
  // Group items
  for (const item of workItems) {
    const group = grouped.get(item.type);
    if (group) {
      group.push(item);
    }
  }
  
  return grouped;
}

/**
 * Format work items as SelectList items with grouping
 */
function formatSelectItems(grouped: Map<string, WorkItem[]>): SelectItem[] {
  const items: SelectItem[] = [];
  const typeOrder = ["Issues", "Tasks", "PRs", "Patchani ToDo"];
  
  for (const type of typeOrder) {
    const groupItems = grouped.get(type) || [];
    
    if (groupItems.length === 0) {
      continue;
    }
    
    // Add group header (non-selectable, displayed as disabled item)
    items.push({
      value: `__header_${type}__`,
      label: `──── ${type} (${groupItems.length}) ────`,
      description: "",
    });
    
    // Add group items
    for (const item of groupItems) {
      const priorityIcon = getPriorityIcon(item.priority);
      const statusIcon = item.completed ? "✓" : " ";
      
      items.push({
        value: item.id,
        label: `${statusIcon} ${priorityIcon} ${item.title}`,
        description: item.url || "",
      });
    }
    
    // Add spacing between groups
    if (typeOrder.indexOf(type) < typeOrder.length - 1) {
      items.push({
        value: `__spacer_${type}__`,
        label: "",
        description: "",
      });
    }
  }
  
  return items;
}

/**
 * Get priority icon for display
 */
function getPriorityIcon(priority?: string): string {
  switch (priority?.toLowerCase()) {
    case "high":
      return "🔴";
    case "medium":
      return "🟡";
    case "low":
      return "🟢";
    default:
      return "⚪";
  }
}

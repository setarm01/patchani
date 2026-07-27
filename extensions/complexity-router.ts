/**
 * Complexity Assessment Dialog
 * 
 * Analyzes work items for complexity indicators and routes to design doc
 * workflow when needed. Shows interactive dialog with recommendations.
 */

import type { Theme } from "@earendil-works/pi-coding-agent";
import { Container, Text, Spacer, SelectList, type SelectItem } from "@earendil-works/pi-tui";

interface WorkItem {
  label: string;
  value: string;
  description?: string;
}

/**
 * Assess complexity and show routing dialog
 * 
 * @param ctx - Extension context with UI access
 * @param selectedItem - Work item to assess
 * @returns Decision: "design-doc", "proceed", or null (cancel)
 */
export async function assessComplexity(
  ctx: any,
  selectedItem: WorkItem
): Promise<string | null> {
  // Analyze item for complexity indicators
  const complexityIndicators = [
    /feat:/i.test(selectedItem.label) && "New feature implementation",
    /\bnew\b/i.test(selectedItem.label) && "New component/system",
    /architecture/i.test(selectedItem.label) && "Architectural changes",
    /refactor/i.test(selectedItem.label) && "Code refactoring",
    /migration/i.test(selectedItem.label) && "System migration",
    /multi[- ]?file/i.test(selectedItem.label) && "Multi-file changes",
  ].filter(Boolean) as string[];
  
  const isComplex = complexityIndicators.length > 0;
  
  // Build options
  const options: SelectItem[] = [
    {
      value: "design-doc",
      label: "Yes - /design-doc <topic>",
      description: "Start with design document workflow"
    },
    {
      value: "proceed",
      label: "No - proceed with Understand phase",
      description: "Skip design doc and continue"
    },
    {
      value: "cancel",
      label: "Cancel - back to work items",
      description: "Return to work item selection"
    }
  ];
  
  // Show interactive dialog
  const result = await ctx.ui.custom((tui: any, theme: Theme, _kb: any, done: (value: string | null) => void) => {
    const container = new Container();
    
    // Title
    container.addChild(new Text(theme.fg("accent", theme.bold("Complexity Assessment")), 1, 1));
    container.addChild(new Spacer(1));
    
    // Selected item
    container.addChild(new Text(theme.fg("text", `Work Item: ${selectedItem.label}`), 1, 0));
    container.addChild(new Spacer(1));
    
    // Analysis section
    if (complexityIndicators.length > 0) {
      container.addChild(new Text(theme.fg("muted", "Analysis:"), 1, 0));
      for (const indicator of complexityIndicators) {
        container.addChild(new Text(theme.fg("success", `  • ${indicator}`), 1, 0));
      }
      container.addChild(new Spacer(1));
      
      // Recommendation
      container.addChild(new Text(
        theme.fg("accent", theme.bold("Recommendation: Start with design doc")),
        1,
        0
      ));
      container.addChild(new Spacer(1));
    } else {
      container.addChild(new Text(theme.fg("muted", "Analysis:"), 1, 0));
      container.addChild(new Text(theme.fg("success", "  • No major complexity indicators detected"), 1, 0));
      container.addChild(new Spacer(1));
      
      // Recommendation
      container.addChild(new Text(
        theme.fg("muted", "Recommendation: Proceed with standard workflow"),
        1,
        0
      ));
      container.addChild(new Spacer(1));
    }
    
    // Question prompt
    container.addChild(new Text(theme.fg("text", "Should we start with a design document?"), 1, 0));
    container.addChild(new Spacer(1));
    
    // SelectList
    const list = new SelectList(options, 5, {
      selectedPrefix: (t: string) => theme.fg("accent", t),
      selectedText: (t: string) => theme.fg("accent", t),
      description: (t: string) => theme.fg("muted", t),
      scrollInfo: (t: string) => theme.fg("dim", t),
      noMatch: (t: string) => theme.fg("warning", t),
    });
    
    list.onSelect = (item) => done(item.value);
    list.onCancel = () => done(null);
    
    container.addChild(list);
    
    // Help text
    container.addChild(new Spacer(1));
    container.addChild(new Text(
      theme.fg("dim", "↑↓ navigate • enter select • esc cancel"),
      1,
      0
    ));
    
    return {
      render: (width: number) => container.render(width),
      invalidate: () => container.invalidate(),
      handleInput: (data: string) => {
        list.handleInput(data);
        tui.requestRender();
      },
    };
  });
  
  return result;
}

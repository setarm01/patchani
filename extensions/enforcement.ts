/**
 * Patchani Workflow Enforcement Extension
 * 
 * Hard enforcement of workflow methodology:
 * - Design doc workflow ordering (intake → validation → research → writing)
 * - Block implementation before design doc exists
 * - Maintain workflow state across session
 * 
 * This is deterministic - LLM cannot bypass these gates.
 */

import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { existsSync } from "node:fs";
import { join } from "node:path";

interface WorkflowState {
  inDesignDoc: boolean;
  topic?: string;
  completedSteps: string[];
  validationApproved: boolean;
}

// Workflow step dependencies
const DESIGN_DOC_WORKFLOW = {
  "design_doc_start": [],
  "design_doc_validate": ["design_doc_start"],
  "design_doc_research": ["design_doc_validate"],
  "design_doc_fact_check": ["design_doc_research"],
  "design_doc_next_section": ["design_doc_research"]
};

export default function (pi: ExtensionAPI) {
  
  // Get current workflow state from session
  function getWorkflowState(ctx: any): WorkflowState {
    const entries = ctx.sessionManager.getEntries();
    for (const entry of entries.reverse()) {
      if (entry.type === "custom" && entry.customType === "design-doc-state") {
        return {
          inDesignDoc: true,
          topic: entry.data.topic,
          completedSteps: entry.data.sectionsCompleted || [],
          validationApproved: entry.data.validationApproved || false
        };
      }
    }
    return {
      inDesignDoc: false,
      completedSteps: [],
      validationApproved: false
    };
  }
  
  // Check if a design doc exists in the repo
  function hasDesignDoc(cwd: string): boolean {
    const patterns = [
      "product-design-document.md",
      "design-doc.md",
      "DESIGN.md",
      "docs/design.md"
    ];
    return patterns.some(p => existsSync(join(cwd, p)));
  }
  
  // Check if a file is an implementation file (not docs/tests)
  function isImplementationFile(path: string): boolean {
    if (!path) return false;
    const skipPatterns = [
      /\.md$/,
      /^docs\//,
      /^tests?\//,
      /\.test\./,
      /\.spec\./,
      /README/,
      /CHANGELOG/,
      /LICENSE/
    ];
    return !skipPatterns.some(pattern => pattern.test(path));
  }
  
  // Enforce design doc workflow ordering
  pi.on("tool_call", async (event, ctx) => {
    const state = getWorkflowState(ctx);
    
    // Enforce design doc workflow steps
    const prereqs = DESIGN_DOC_WORKFLOW[event.toolName as keyof typeof DESIGN_DOC_WORKFLOW];
    if (prereqs !== undefined) {
      // Check if all prerequisites are met
      for (const prereq of prereqs) {
        if (!state.completedSteps.includes(prereq) && prereq !== event.toolName) {
          return {
            block: true,
            reason: `Workflow violation: Must complete ${prereq} before ${event.toolName}.`
          };
        }
      }
      
      // Special validation check for design_doc_research
      if (event.toolName === "design_doc_research" && !state.validationApproved) {
        return {
          block: true,
          reason: "Workflow violation: User must approve validation before research."
        };
      }
    }
    
    // Block implementation before design doc exists
    if ((event.toolName === "write" || event.toolName === "edit") && 
        event.input?.path && isImplementationFile(event.input.path as string)) {
      
      if (!state.inDesignDoc && !hasDesignDoc(ctx.cwd)) {
        return {
          block: true,
          reason: "Patchani methodology: Start with a design doc before implementing. Use design_doc_start tool."
        };
      }
    }
    
    // Allow tool execution
    return undefined;
  });
}

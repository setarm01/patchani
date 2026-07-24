/**
 * Patchani - Design Document Extension
 * 
 * Programmatically enforced design document workflow.
 * Interrogates, researches, validates, and generates design docs incrementally.
 * 
 * Features:
 * - Structured intake with validation gates
 * - Background research workflows (GitHub + codebase + web)
 * - Fact-checking with parallel verification
 * - Section-by-section generation with approval
 * - Template enforcement
 */

import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";

interface DesignDocState {
  phase: "intake" | "validation" | "research" | "writing" | "complete";
  topic: string;
  problemSpace?: string;
  stakeholders?: string;
  constraints?: string;
  scope?: {
    inScope: string[];
    outScope: string[];
  };
  sectionsCompleted: string[];
  researchFindings?: any;
  validationApproved: boolean;
}

const TEMPLATE_SECTIONS = [
  "Introduction",
  "Background",
  "Use Cases",
  "Data Model Mapping",
  "System Architecture",
  "Verification Criteria",
  "Open Points",
  "Appendix"
];

export default function (pi: ExtensionAPI) {
  
  // Session state tracking
  let currentState: DesignDocState | null = null;
  
  // Helper: Save state to session
  function saveState(state: DesignDocState) {
    currentState = state;
    pi.appendEntry("design-doc-state", state);
  }
  
  // Helper: Restore state from session
  function restoreState(ctx: any): DesignDocState | null {
    const entries = ctx.sessionManager.getEntries();
    for (const entry of entries.reverse()) {
      if (entry.type === "custom" && entry.customType === "design-doc-state") {
        return entry.data as DesignDocState;
      }
    }
    return null;
  }
  
  // Tool: Start design doc workflow
  pi.registerTool({
    name: "design_doc_start",
    label: "Start Design Doc",
    description: "Initialize design document workflow with intake questions",
    parameters: Type.Object({
      topic: Type.String({ description: "High-level topic for the design doc" })
    }),
    async execute(toolCallId, params, signal, onUpdate, ctx) {
      // Initialize state
      const state: DesignDocState = {
        phase: "intake",
        topic: params.topic,
        sectionsCompleted: [],
        validationApproved: false
      };
      
      saveState(state);
      
      const intakeQuestions = `Design Document: ${params.topic}\n\n` +
        `**Intake Phase** — Answer these questions before we proceed:\n\n` +
        `**Problem Space:**\n` +
        `1. What problem does this solve? What breaks or is missing today?\n` +
        `2. Who is affected and how do they experience it?\n` +
        `3. What is the forcing function (deadline, compliance, incident, stakeholder ask)?\n\n` +
        `**Scope:**\n` +
        `4. What is explicitly IN scope?\n` +
        `5. What is explicitly OUT of scope?\n` +
        `6. Are there adjacent systems that could be in scope but shouldn't be — and why?\n\n` +
        `**Constraints:**\n` +
        `7. Technical constraints (existing infra, language, platform)?\n` +
        `8. Time, budget, or team-size constraints?\n` +
        `9. Compliance, security, or regulatory constraints?\n\n` +
        `**Known Unknowns:**\n` +
        `10. What do you not know yet that you know you don't know?\n` +
        `11. What external dependencies are unresolved?`;
      
      return {
        content: [{ type: "text", text: intakeQuestions }],
        details: { phase: "intake", topic: params.topic }
      };
    }
  });
  
  // Tool: Validate intake answers
  pi.registerTool({
    name: "design_doc_validate",
    label: "Validate Design Doc Intake",
    description: "Validate user's intake answers before proceeding to research",
    parameters: Type.Object({
      problemSpace: Type.String({ description: "Summary of problem space" }),
      stakeholders: Type.String({ description: "Who is affected" }),
      inScope: Type.Array(Type.String(), { description: "In-scope items" }),
      outScope: Type.Array(Type.String(), { description: "Out-of-scope items" }),
      constraints: Type.String({ description: "Technical, time, compliance constraints" }),
      knownUnknowns: Type.String({ description: "Known unknowns and unresolved dependencies" })
    }),
    async execute(toolCallId, params, signal, onUpdate, ctx) {
      const state = restoreState(ctx) || currentState;
      if (!state) {
        return {
          content: [{ type: "text", text: "Error: No active design doc. Start with design_doc_start." }],
          details: {},
          isError: true
        };
      }
      
      // Update state
      state.problemSpace = params.problemSpace;
      state.stakeholders = params.stakeholders;
      state.constraints = params.constraints;
      state.scope = {
        inScope: params.inScope,
        outScope: params.outScope
      };
      state.phase = "validation";
      saveState(state);
      
      // Generate validation summary
      const summary = `**Validation Summary**\n\n` +
        `**Problem:** ${params.problemSpace}\n\n` +
        `**Stakeholders:** ${params.stakeholders}\n\n` +
        `**In Scope:**\n${params.inScope.map(s => `- ${s}`).join('\n')}\n\n` +
        `**Out of Scope:**\n${params.outScope.map(s => `- ${s}`).join('\n')}\n\n` +
        `**Constraints:** ${params.constraints}\n\n` +
        `**Known Unknowns:** ${params.knownUnknowns}\n\n` +
        `---\n\n` +
        `**Is this framing accurate? Reply "approved" to proceed to research phase, or provide corrections.**`;
      
      return {
        content: [{ type: "text", text: summary }],
        details: { phase: "validation" }
      };
    }
  });
  
  // Tool: Trigger research workflow
  pi.registerTool({
    name: "design_doc_research",
    label: "Design Doc Research",
    description: "Trigger parallelized research workflow for design doc (GitHub + codebase + web)",
    parameters: Type.Object({
      approved: Type.Boolean({ description: "User approved the validation summary" })
    }),
    async execute(toolCallId, params, signal, onUpdate, ctx) {
      if (!params.approved) {
        return {
          content: [{ type: "text", text: "Validation not approved. Please provide corrections." }],
          details: {}
        };
      }
      
      const state = restoreState(ctx) || currentState;
      if (!state || state.phase !== "validation") {
        return {
          content: [{ type: "text", text: "Error: Must complete validation first." }],
          details: {},
          isError: true
        };
      }
      
      state.phase = "research";
      state.validationApproved = true;
      saveState(state);
      
      // Generate workflow prompt for research
      const researchPrompt = `Run a workflow to research "${state.topic}" for design document.\n\n` +
        `**Research sources (parallel):**\n\n` +
        `1. **GitHub Discovery** (tier: small)\n` +
        `   - Find issues: label related to topic OR mentions in title/body\n` +
        `   - Find PRs: touched relevant files\n` +
        `   - Find discussions: architectural decisions\n` +
        `   - Find Projects: related work items\n\n` +
        `2. **Codebase Analysis** (tier: small for grep, medium for analysis)\n` +
        `   - Grep for relevant patterns, imports, implementations\n` +
        `   - Find and analyze related middleware/core files\n` +
        `   - Analyze test files to understand expected behavior\n` +
        `   - Extract ADRs, docs, runbooks\n\n` +
        `3. **Web Research** (tier: big - use nested deep-research workflow)\n` +
        `   - Official documentation (specs, RFCs)\n` +
        `   - Security advisories (OWASP, CVE)\n` +
        `   - Best practices from authoritative sources\n` +
        `   - Academic papers if relevant\n\n` +
        `**After discovery, do targeted deep dives on key findings.**\n\n` +
        `**Finally, synthesize into:** Current state, Known limitations, Team decisions, External best practices.\n\n` +
        `Context from intake:\n` +
        `- Problem: ${state.problemSpace}\n` +
        `- Scope: ${state.scope?.inScope.join(', ')}\n` +
        `- Constraints: ${state.constraints}`;
      
      return {
        content: [{ type: "text", text: researchPrompt }],
        details: { phase: "research", workflowTriggered: true }
      };
    }
  });
  
  // Tool: Fact-check claims
  pi.registerTool({
    name: "design_doc_fact_check",
    label: "Fact-Check Claims",
    description: "Verify design doc claims across multiple sources in parallel",
    parameters: Type.Object({
      claims: Type.Array(Type.String(), { description: "Claims to verify" })
    }),
    async execute(toolCallId, params, signal, onUpdate, ctx) {
      const state = restoreState(ctx) || currentState;
      if (!state) {
        return {
          content: [{ type: "text", text: "Error: No active design doc session." }],
          details: {},
          isError: true
        };
      }
      
      const workflowPrompt = `Run a workflow to verify these design doc claims:\n\n` +
        params.claims.map((claim, i) => `${i + 1}. ${claim}`).join('\n') + '\n\n' +
        `**Verification strategy (parallel):**\n\n` +
        `For each claim, verify across:\n` +
        `- **Codebase** (tier: medium): grep, file analysis, test validation\n` +
        `- **GitHub** (tier: small): issues, PRs, discussions for evidence\n` +
        `- **Documentation** (tier: medium): README, ADRs, wikis\n\n` +
        `**Return for each claim:**\n` +
        `- Status: VERIFIED or UNVERIFIED\n` +
        `- Evidence: specific file, issue, or doc reference\n` +
        `- Confidence: high/medium/low\n\n` +
        `Mark unverified claims as **assumptions** in the design doc.`;
      
      return {
        content: [{ type: "text", text: workflowPrompt }],
        details: { claimsCount: params.claims.length }
      };
    }
  });
  
  // Tool: Generate next section
  pi.registerTool({
    name: "design_doc_next_section",
    label: "Generate Next Section",
    description: "Generate next design doc section with validation gate",
    parameters: Type.Object({
      section: Type.String({ description: "Section name to generate" }),
      researchComplete: Type.Boolean({ description: "Research phase completed" })
    }),
    async execute(toolCallId, params, signal, onUpdate, ctx) {
      const state = restoreState(ctx) || currentState;
      if (!state) {
        return {
          content: [{ type: "text", text: "Error: No active design doc session." }],
          details: {},
          isError: true
        };
      }
      
      if (!params.researchComplete && params.section === "Background") {
        return {
          content: [{ type: "text", text: "Error: Must complete research before generating Background section." }],
          details: {},
          isError: true
        };
      }
      
      if (!TEMPLATE_SECTIONS.includes(params.section)) {
        return {
          content: [{ type: "text", text: `Error: Invalid section. Must be one of: ${TEMPLATE_SECTIONS.join(', ')}` }],
          details: {},
          isError: true
        };
      }
      
      state.phase = "writing";
      state.sectionsCompleted.push(params.section);
      saveState(state);
      
      // Section-specific guidance
      const sectionGuidance: Record<string, string> = {
        "Introduction": "- Problem Statement (no solution language)\n- Goals (measurable outcomes)",
        "Background": "- System context\n- Data sources\n- Explicit gaps\n- Use research findings",
        "Use Cases": "- Actor + action pairs\n- Success criteria\n- No implementation details",
        "Data Model Mapping": "- Coverage table first\n- Required vs Optional fields\n- Flag unconfirmed sources",
        "System Architecture": "- Approach paragraph (why this design, tradeoffs, alternatives rejected)\n- Mermaid diagram\n- Component design\n- Options comparison if applicable",
        "Verification Criteria": "- Measurable, specific\n- Explain how to prove each criterion\n- Quantitative estimates where relevant",
        "Open Points": "- Summary table\n- Impact + resolution path for each\n- Only genuine blockers",
        "Appendix": "- Feasibility analysis\n- Options comparison (if not inline)\n- Reference material"
      };
      
      const guidance = `Generate **${params.section}** section.\n\n` +
        `**Requirements:**\n${sectionGuidance[params.section]}\n\n` +
        `**Template compliance:**\n` +
        `- Author line: _Author: User Name & Patchani_\n` +
        `- Date: ${new Date().toISOString().split('T')[0]}\n` +
        `- Mermaid diagrams for architecture\n` +
        `- Tables for mappings/coverage/open points\n\n` +
        `**After generating, ask user: "Does this section look right, or should we adjust before moving on?"**`;
      
      return {
        content: [{ type: "text", text: guidance }],
        details: { section: params.section, sectionsCompleted: state.sectionsCompleted.length }
      };
    }
  });
  
  // Command: Start design doc
  pi.registerCommand("design-doc", {
    description: "Start design document workflow (usage: /design-doc <topic>)",
    handler: async (args, ctx) => {
      if (!args || !args.trim()) {
        ctx.ui.notify("Usage: /design-doc <topic>", "error");
        return;
      }
      
      ctx.ui.notify(`Starting design doc: ${args}`, "info");
      // LLM will call design_doc_start tool
    }
  });
  
  // Restore state on session start
  pi.on("session_start", async (event, ctx) => {
    const state = restoreState(ctx);
    if (state) {
      currentState = state;
      ctx.ui.notify(`Design doc session restored: ${state.topic} (${state.phase} phase)`, "info");
    }
  });
}

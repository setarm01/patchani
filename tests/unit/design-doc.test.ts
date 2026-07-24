/**
 * Unit tests for design-doc.ts extension
 * Tests design doc workflow state management and tool registration
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

const mockExtensionAPI = () => {
  const tools: Record<string, any> = {};
  const commands: Record<string, any> = {};
  const hooks: Record<string, any[]> = {};
  
  return {
    registerTool: vi.fn((config: any) => {
      tools[config.name] = config;
    }),
    registerCommand: vi.fn((name: string, config: any) => {
      commands[name] = config;
    }),
    on: vi.fn((event: string, handler: any) => {
      if (!hooks[event]) hooks[event] = [];
      hooks[event].push(handler);
    }),
    appendEntry: vi.fn(),
    _tools: tools,
    _commands: commands,
    _hooks: hooks
  };
};

const mockContext = () => ({
  sessionManager: {
    getEntries: vi.fn(() => [])
  },
  ui: {
    notify: vi.fn()
  }
});

describe("Design Doc Extension", () => {
  let mockAPI: any;
  let mockCtx: any;
  
  beforeEach(() => {
    mockAPI = mockExtensionAPI();
    mockCtx = mockContext();
  });
  
  it("should register all design doc tools", async () => {
    const designDocModule = await import("../../extensions/design-doc");
    const designDocExtension = designDocModule.default;
    
    designDocExtension(mockAPI);
    
    expect(mockAPI.registerTool).toHaveBeenCalledWith(
      expect.objectContaining({ name: "design_doc_start" })
    );
    expect(mockAPI.registerTool).toHaveBeenCalledWith(
      expect.objectContaining({ name: "design_doc_validate" })
    );
    expect(mockAPI.registerTool).toHaveBeenCalledWith(
      expect.objectContaining({ name: "design_doc_research" })
    );
    expect(mockAPI.registerTool).toHaveBeenCalledWith(
      expect.objectContaining({ name: "design_doc_fact_check" })
    );
    expect(mockAPI.registerTool).toHaveBeenCalledWith(
      expect.objectContaining({ name: "design_doc_next_section" })
    );
  });
  
  it("should register /design-doc command", async () => {
    const designDocModule = await import("../../extensions/design-doc");
    const designDocExtension = designDocModule.default;
    
    designDocExtension(mockAPI);
    
    expect(mockAPI.registerCommand).toHaveBeenCalledWith(
      "design-doc",
      expect.any(Object)
    );
  });
  
  it("design_doc_start should initialize state", async () => {
    const designDocModule = await import("../../extensions/design-doc");
    const designDocExtension = designDocModule.default;
    
    designDocExtension(mockAPI);
    
    const tool = mockAPI._tools.design_doc_start;
    const result = await tool.execute(
      "call-1",
      { topic: "OAuth Authentication" },
      null,
      vi.fn(),
      mockCtx
    );
    
    expect(result.content[0].text).toContain("OAuth Authentication");
    expect(result.content[0].text).toContain("Intake Phase");
    expect(mockAPI.appendEntry).toHaveBeenCalledWith(
      "design-doc-state",
      expect.objectContaining({
        phase: "intake",
        topic: "OAuth Authentication"
      })
    );
  });
  
  it("design_doc_validate should require all fields", async () => {
    const designDocModule = await import("../../extensions/design-doc");
    const designDocExtension = designDocModule.default;
    
    designDocExtension(mockAPI);
    
    // Start first
    const startTool = mockAPI._tools.design_doc_start;
    await startTool.execute(
      "call-1",
      { topic: "Test" },
      null,
      vi.fn(),
      mockCtx
    );
    
    // Validate
    const validateTool = mockAPI._tools.design_doc_validate;
    const result = await validateTool.execute(
      "call-2",
      {
        problemSpace: "Auth is broken",
        stakeholders: "Users",
        inScope: ["OAuth", "JWT"],
        outScope: ["SAML"],
        constraints: "Must use existing DB",
        knownUnknowns: "Token refresh strategy"
      },
      null,
      vi.fn(),
      mockCtx
    );
    
    expect(result.content[0].text).toContain("Validation Summary");
    expect(result.content[0].text).toContain("OAuth");
    expect(result.details.phase).toBe("validation");
  });
  
  it("design_doc_research should require approval", async () => {
    const designDocModule = await import("../../extensions/design-doc");
    const designDocExtension = designDocModule.default;
    
    designDocExtension(mockAPI);
    
    const researchTool = mockAPI._tools.design_doc_research;
    
    // Without approval
    const result1 = await researchTool.execute(
      "call-1",
      { approved: false },
      null,
      vi.fn(),
      mockCtx
    );
    
    expect(result1.content[0].text).toContain("not approved");
    
    // Setup state for approval test
    mockCtx.sessionManager.getEntries.mockReturnValue([
      {
        type: "custom",
        customType: "design-doc-state",
        data: {
          phase: "validation",
          topic: "Test",
          validationApproved: false
        }
      }
    ]);
    
    // With approval
    const result2 = await researchTool.execute(
      "call-2",
      { approved: true },
      null,
      vi.fn(),
      mockCtx
    );
    
    expect(result2.content[0].text).toContain("workflow");
    expect(result2.details.workflowTriggered).toBe(true);
  });
  
  it("design_doc_next_section should validate section names", async () => {
    const designDocModule = await import("../../extensions/design-doc");
    const designDocExtension = designDocModule.default;
    
    designDocExtension(mockAPI);
    
    const sectionTool = mockAPI._tools.design_doc_next_section;
    
    // Need to establish state first
    mockCtx.sessionManager.getEntries.mockReturnValue([]);
    
    // Invalid section - should fail because no state
    const result1 = await sectionTool.execute(
      "call-1",
      { section: "Invalid Section", researchComplete: true },
      null,
      vi.fn(),
      mockCtx
    );
    
    expect(result1.isError).toBe(true);
    expect(result1.content[0].text).toContain("No active design doc");
    
    // Valid section with state
    mockCtx.sessionManager.getEntries.mockReturnValue([
      {
        type: "custom",
        customType: "design-doc-state",
        data: {
          phase: "writing",
          topic: "Test",
          sectionsCompleted: []
        }
      }
    ]);
    
    // Now test invalid section name
    const result2 = await sectionTool.execute(
      "call-2",
      { section: "Invalid Section", researchComplete: true },
      null,
      vi.fn(),
      mockCtx
    );
    
    expect(result2.isError).toBe(true);
    expect(result2.content[0].text).toContain("Invalid section");
    
    // Valid section name
    const result3 = await sectionTool.execute(
      "call-3",
      { section: "Introduction", researchComplete: true },
      null,
      vi.fn(),
      mockCtx
    );
    
    expect(result3.content[0].text).toContain("Introduction");
    expect(result3.details.section).toBe("Introduction");
  });
});

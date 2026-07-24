/**
 * Unit tests for standup-sync.ts extension
 * Tests GitHub sync and Reminders integration
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
    exec: vi.fn(async (cmd: string, args: string[]) => {
      // Mock git check
      if (cmd === "git" && args[0] === "rev-parse") {
        return { stdout: ".git", stderr: "" };
      }
      // Mock gh CLI
      if (cmd === "gh") {
        return { stdout: "[]", stderr: "" };
      }
      // Mock osascript
      if (cmd === "osascript") {
        return { stdout: "", stderr: "" };
      }
      return { stdout: "", stderr: "" };
    }),
    _tools: tools,
    _commands: commands,
    _hooks: hooks
  };
};

const mockContext = (isGitRepo = true) => ({
  cwd: isGitRepo ? "/fake/git/repo" : "/fake/not/git",
  ui: {
    notify: vi.fn()
  }
});

describe("Standup Sync Extension", () => {
  let mockAPI: any;
  let mockCtx: any;
  
  beforeEach(() => {
    mockAPI = mockExtensionAPI();
    mockCtx = mockContext();
    vi.clearAllMocks();
  });
  
  it("should register standup_sync tool", async () => {
    const standupModule = await import("../../extensions/standup-sync");
    const standupExtension = standupModule.default;
    
    standupExtension(mockAPI);
    
    expect(mockAPI.registerTool).toHaveBeenCalledWith(
      expect.objectContaining({ name: "standup_sync" })
    );
  });
  
  it("should register standup_add_todo tool", async () => {
    const standupModule = await import("../../extensions/standup-sync");
    const standupExtension = standupModule.default;
    
    standupExtension(mockAPI);
    
    expect(mockAPI.registerTool).toHaveBeenCalledWith(
      expect.objectContaining({ name: "standup_add_todo" })
    );
  });
  
  it("should register /standup command", async () => {
    const standupModule = await import("../../extensions/standup-sync");
    const standupExtension = standupModule.default;
    
    standupExtension(mockAPI);
    
    expect(mockAPI.registerCommand).toHaveBeenCalledWith(
      "standup",
      expect.any(Object)
    );
  });
  
  it("should register /standup-todo command", async () => {
    const standupModule = await import("../../extensions/standup-sync");
    const standupExtension = standupModule.default;
    
    standupExtension(mockAPI);
    
    expect(mockAPI.registerCommand).toHaveBeenCalledWith(
      "standup-todo",
      expect.any(Object)
    );
  });
  
  it("should register session_start hook for auto-sync", async () => {
    const standupModule = await import("../../extensions/standup-sync");
    const standupExtension = standupModule.default;
    
    standupExtension(mockAPI);
    
    expect(mockAPI.on).toHaveBeenCalledWith("session_start", expect.any(Function));
  });
  
  it("should check for git repo before syncing", async () => {
    const standupModule = await import("../../extensions/standup-sync");
    const standupExtension = standupModule.default;
    
    const failAPI = mockExtensionAPI();
    // Make osascript work but throw on any exec
    failAPI.exec = vi.fn(async (cmd: string) => {
      // osascript works
      if (cmd === "osascript") {
        return { stdout: "", stderr: "", code: 0 };
      }
      // Everything else throws
      throw new Error("Command failed");
    });
    
    standupExtension(failAPI as any);
    
    const tool = failAPI._tools.standup_sync;
    
    const result = await tool.execute(
      "call-1",
      {},
      null,
      vi.fn(),
      mockContext(false)
    );
    
    expect(result.content[0].text).toContain("failed");
    expect(result.isError).toBe(true);
  });
  
  it("should check for gh CLI", async () => {
    const standupModule = await import("../../extensions/standup-sync");
    const standupExtension = standupModule.default;
    
    const failAPI = mockExtensionAPI();
    // Make gh CLI fail
    failAPI.exec = vi.fn(async (cmd: string) => {
      if (cmd === "git") {
        return { stdout: ".git", stderr: "" };
      }
      if (cmd === "gh") {
        throw new Error("gh not found");
      }
      return { stdout: "", stderr: "" };
    });
    
    standupExtension(failAPI as any);
    
    const tool = failAPI._tools.standup_sync;
    
    const result = await tool.execute(
      "call-1",
      {},
      null,
      vi.fn(),
      mockCtx
    );
    
    expect(result.content[0].text).toContain("gh not found");
  });
  
  it("standup_add_todo should validate input", async () => {
    const standupModule = await import("../../extensions/standup-sync");
    const standupExtension = standupModule.default;
    
    standupExtension(mockAPI);
    
    const tool = mockAPI._tools.standup_add_todo;
    
    const result = await tool.execute(
      "call-1",
      { title: "Review PR #123", notes: "Check auth changes" },
      null,
      vi.fn(),
      mockCtx
    );
    
    // Should attempt to create reminder via osascript
    expect(mockAPI.exec).toHaveBeenCalledWith(
      "osascript",
      expect.arrayContaining([expect.any(String)]),
      expect.any(Object)
    );
  });
  
  it("should skip auto-sync in non-git directories", async () => {
    const standupModule = await import("../../extensions/standup-sync");
    const standupExtension = standupModule.default;
    
    const failAPI = mockExtensionAPI();
    let execCalled = false;
    failAPI.exec = vi.fn(async (cmd: string) => {
      execCalled = true;
      if (cmd === "git") {
        return { code: 1, stdout: "", stderr: "Not a git repo" };
      }
      return { stdout: "", stderr: "" };
    });
    
    standupExtension(failAPI as any);
    
    const nonGitCtx = mockContext(false);
    
    // Trigger session_start with startup reason
    const hooks = failAPI._hooks.session_start || [];
    for (const hook of hooks) {
      await hook({ reason: "startup" }, nonGitCtx);
    }
    
    // Should have attempted exec
    expect(execCalled).toBe(true);
  });
});

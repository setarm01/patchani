// @ts-ignore - canvas module types not available
import { createCanvas } from "@napi-rs/canvas";
import { Image } from "@earendil-works/pi-tui";

interface SubAgent {
  name: string;
  status: "complete" | "running" | "waiting";
}

interface Phase {
  name: string;
  status: "complete" | "running" | "waiting";
  progress?: string;
  subAgents?: SubAgent[];
}

interface WorkflowState {
  phases: Phase[];
}

// Color constants
const COLORS = {
  background: "#1a1a2e",
  complete: "#06ffa5",
  running: "#8338ec",
  waiting: "#4a4a6a",
  text: "#ffffff",
  inactive: "#666666",
};

// Animation state
let animationFrame = 0;

/**
 * Draw a node with optional glow effect and animated spinner
 */
function drawNode(
  ctx: any,
  x: number,
  y: number,
  label: string,
  status: "complete" | "running" | "waiting",
  radius: number = 30
): void {
  // Set color based on status
  let color = COLORS.waiting;
  if (status === "complete") color = COLORS.complete;
  if (status === "running") color = COLORS.running;

  // Draw glow effect for running nodes
  if (status === "running") {
    ctx.shadowBlur = 20;
    ctx.shadowColor = color;
  } else {
    ctx.shadowBlur = 0;
  }

  // Draw node circle
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();

  // Draw animated spinner for running nodes
  if (status === "running") {
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 3;
    ctx.shadowBlur = 0;
    const startAngle = (animationFrame * Math.PI) / 30;
    const endAngle = startAngle + Math.PI;
    ctx.beginPath();
    ctx.arc(x, y, radius + 10, startAngle, endAngle);
    ctx.stroke();
  }

  // Draw label
  ctx.shadowBlur = 0;
  ctx.fillStyle = COLORS.text;
  ctx.font = "bold 14px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(label, x, y);
}

/**
 * Draw a connection line between two nodes
 */
function drawConnection(
  ctx: any,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  active: boolean
): void {
  if (active) {
    // Create gradient for active connections
    const gradient = ctx.createLinearGradient(x1, y1, x2, y2);
    gradient.addColorStop(0, COLORS.complete);
    gradient.addColorStop(1, COLORS.running);
    ctx.strokeStyle = gradient;
    ctx.lineWidth = 3;
  } else {
    ctx.strokeStyle = COLORS.inactive;
    ctx.lineWidth = 2;
  }

  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
}

/**
 * Draw a small sub-agent node
 */
function drawSubAgent(
  ctx: any,
  x: number,
  y: number,
  label: string,
  status: "complete" | "running" | "waiting"
): void {
  drawNode(ctx, x, y, label, status, 20);
  
  // Draw label below
  ctx.fillStyle = COLORS.text;
  ctx.font = "10px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(label, x, y + 35);
}

/**
 * Generate workflow graph PNG as base64 string
 */
function generateWorkflowGraph(state: WorkflowState): string {
  const width = 800;
  const height = 500;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");

  // Draw background
  ctx.fillStyle = COLORS.background;
  ctx.fillRect(0, 0, width, height);

  // Layout positions
  const centerX = width / 2;
  const positions = {
    intake: { x: centerX, y: 80 },
    research: { x: centerX, y: 200 },
    validation: { x: centerX, y: 350 },
    writing: { x: centerX, y: 430 },
  };

  // Sub-agent positions (for Research phase)
  const subAgentSpacing = 140;
  const subAgentStartX = centerX - (3 * subAgentSpacing) / 2;
  const subAgentY = positions.research.y + 80;

  // Find phases
  const intake = state.phases.find((p) => p.name === "Intake");
  const research = state.phases.find((p) => p.name === "Research");
  const validation = state.phases.find((p) => p.name === "Validation");
  const writing = state.phases.find((p) => p.name === "Writing");

  // Draw connections
  if (intake && research) {
    drawConnection(
      ctx,
      positions.intake.x,
      positions.intake.y + 35,
      positions.research.x,
      positions.research.y - 35,
      intake.status === "complete"
    );
  }

  if (research && validation) {
    drawConnection(
      ctx,
      positions.research.x,
      positions.research.y + 35,
      positions.validation.x,
      positions.validation.y - 35,
      research.status === "complete"
    );
  }

  if (validation && writing) {
    drawConnection(
      ctx,
      positions.validation.x,
      positions.validation.y + 35,
      positions.writing.x,
      positions.writing.y - 35,
      validation.status === "complete"
    );
  }

  // Draw Research sub-agents connections
  if (research && research.subAgents) {
    research.subAgents.forEach((subAgent, i) => {
      const subX = subAgentStartX + i * subAgentSpacing;
      drawConnection(
        ctx,
        positions.research.x,
        positions.research.y + 35,
        subX,
        subAgentY - 25,
        research.status === "running" || research.status === "complete"
      );
    });
  }

  // Draw main phase nodes
  if (intake) {
    drawNode(ctx, positions.intake.x, positions.intake.y, "Intake", intake.status);
  }

  if (research) {
    drawNode(ctx, positions.research.x, positions.research.y, "Research", research.status);
    
    // Draw progress below Research node
    if (research.progress) {
      ctx.fillStyle = COLORS.text;
      ctx.font = "12px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(research.progress, positions.research.x, positions.research.y + 45);
    }

    // Draw sub-agents
    if (research.subAgents) {
      research.subAgents.forEach((subAgent, i) => {
        const subX = subAgentStartX + i * subAgentSpacing;
        drawSubAgent(ctx, subX, subAgentY, subAgent.name, subAgent.status);
      });
    }
  }

  if (validation) {
    drawNode(ctx, positions.validation.x, positions.validation.y, "Validation", validation.status);
  }

  if (writing) {
    drawNode(ctx, positions.writing.x, positions.writing.y, "Writing", writing.status);
  }

  // Update animation frame
  animationFrame = (animationFrame + 1) % 60;

  // Convert to base64
  return canvas.toBuffer("image/png").toString("base64");
}

/**
 * Show animated workflow graph
 */
export function showWorkflowGraph(ctx: any, workflowState: WorkflowState) {
  const { tui, theme } = ctx;

  // Create initial image
  let graphImage = new Image(
    generateWorkflowGraph(workflowState),
    "image/png",
    theme,
    {
      maxWidthCells: 70,
      maxHeightCells: 25,
    }
  );

  // Set up animation interval
  let currentState = workflowState;
  const intervalId = setInterval(() => {
    try {
      const newBase64 = generateWorkflowGraph(currentState);
      // Recreate the image with new data
      graphImage = new Image(
        newBase64,
        "image/png",
        theme,
        {
          maxWidthCells: 70,
          maxHeightCells: 25,
        }
      );
      tui.requestRender();
    } catch (error) {
      console.error("Error updating workflow graph:", error);
      clearInterval(intervalId);
    }
  }, 500);

  // Create render function that returns the image
  const renderFunction = () => graphImage;

  // Set widget with placement below editor
  tui.setWidget("workflow-graph", renderFunction, {
    placement: "belowEditor",
  });

  // Update function to allow external state updates
  return {
    update: (newState: WorkflowState) => {
      currentState = newState;
    },
    stop: () => {
      clearInterval(intervalId);
      tui.removeWidget("workflow-graph");
    },
  };
}

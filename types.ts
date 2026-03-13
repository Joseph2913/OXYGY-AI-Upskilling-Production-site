import { LucideIcon } from 'lucide-react';

export interface SessionType {
  title: string;
  emoji: string;
  type: 'tool' | 'workshop';
  description: string;
}

export interface LevelData {
  id: number;
  name: string;
  tagline: string;
  descriptionCollapsed: string;
  descriptionExpanded: string;
  topics: string[];
  previewTags: string[];
  accentColor: string;
  darkAccentColor: string;
  icon: LucideIcon;
  targetAudience: string[];
  keyTools: string[];
  sessionTypes: SessionType[];
  artifactLink: string;
}

export interface TeamMember {
  name: string;
  role: string;
  image: string;
}

export interface Testimonial {
  quote: string;
  name: string;
  role: string;
  company: string;
}

export interface DepartmentData {
  id: string;
  name: string;
  valueProp: string;
  useCases: string[];
  accentColor: string; // Hex for band/dots
  iconName: string; // key for lucide map
  link: string;
}

// Prompt Engineering Playground types (v1 — legacy, kept for reference)
export interface PromptBlock {
  key: string;
  label: string;
  description: string;
  color: string;
  content: string;
}

export interface PromptResult {
  role: string;
  context: string;
  task: string;
  format: string;
  steps: string;
  quality: string;
}

export interface WizardAnswers {
  role: string;
  context: string;
  task: string;
  formatChips: string[];
  formatCustom: string;
  steps: string;
  qualityChips: string[];
  qualityCustom: string;
}

// Prompt Playground v2.0 — Strategy-aware types
export type StrategyId =
  | 'STRUCTURED_BLUEPRINT'
  | 'CHAIN_OF_THOUGHT'
  | 'PERSONA_EXPERT_ROLE'
  | 'OUTPUT_FORMAT_SPECIFICATION'
  | 'CONSTRAINT_FRAMING'
  | 'FEW_SHOT_EXAMPLES'
  | 'ITERATIVE_DECOMPOSITION'
  | 'TONE_AND_VOICE';

export interface PlaygroundStrategy {
  id: StrategyId;
  name: string;
  icon: string;
  why: string;
  what: string;
  how_applied: string;
  prompt_excerpt: string;
}

export interface PlaygroundResult {
  prompt: string;
  strategies_used: PlaygroundStrategy[];
  refinement_questions?: string[];
}

// Agent Builder Toolkit types (Level 2)
export interface AgentReadinessCriteria {
  score: number;
  assessment: string;
}

export interface AgentReadiness {
  overall_score: number;
  verdict: string;
  rationale: string;
  criteria: {
    frequency: AgentReadinessCriteria;
    consistency: AgentReadinessCriteria;
    shareability: AgentReadinessCriteria;
    complexity: AgentReadinessCriteria;
    standardization_risk: AgentReadinessCriteria;
  };
  level1_points: string[];
  level2_points: string[];
}

export interface AccountabilityCheck {
  name: string;
  severity: 'critical' | 'important' | 'recommended';
  what_to_verify: string;
  why_it_matters: string;
  prompt_instruction: string;
}

export interface AgentDesignResult {
  readiness: AgentReadiness;
  output_format: {
    human_readable: string;
    json_template: Record<string, unknown>;
  };
  system_prompt: string;
  accountability: AccountabilityCheck[];
  refinement_questions?: string[];
}

export interface AgentSetupStep {
  title: string;
  instruction: string;
}

export interface AgentSetupGuide {
  steps: AgentSetupStep[];
  tips: string[];
  limitations: string;
}

// Workflow Designer types (Level 3)
export type NodeLayer = 'input' | 'processing' | 'output';
export type NodeStatus = 'unchanged' | 'added' | 'removed';
export type WorkflowPath = 'a' | 'b';

export interface NodeDefinition {
  nodeId: string;
  name: string;
  icon: string;
  layer: NodeLayer;
  description: string;
}

export interface WorkflowNode {
  id: string;
  node_id: string;
  name: string;
  custom_description?: string;
  layer: NodeLayer;
  status?: NodeStatus;
}

export interface WorkflowGenerateResult {
  workflow_name: string;
  workflow_description: string;
  nodes: WorkflowNode[];
}

export interface WorkflowChange {
  type: 'added' | 'removed';
  node_id: string;
  node_name: string;
  rationale: string;
}

export interface WorkflowFeedbackResult {
  overall_assessment: string;
  suggested_workflow: WorkflowNode[];
  changes: WorkflowChange[];
}

export interface WorkflowDesignPayload {
  mode: 'auto_generate' | 'feedback';
  task_description: string;
  tools_and_systems: string;
  user_workflow?: WorkflowNode[];
  user_rationale?: string;
}

// n8n Workflow Intermediate types (Level 3 — workflow export)
export interface N8nIntermediateNode {
  id: string;
  name: string;
  type: 'trigger' | 'action' | 'ai' | 'condition' | 'transform' | 'output';
  service: string | null;
  n8nNodeKey: string;
  description: string;
  configRequirements: string[];
}

export interface WorkflowIntermediate {
  workflowName: string;
  summary: string;
  complexity: 'simple' | 'moderate' | 'complex';
  estimatedRunTime: string;
  humanInTheLoop: boolean;
  nodes: N8nIntermediateNode[];
  // Rich context for build guide generation
  context?: {
    originalTaskDescription: string;
    toolsAndSystems: string;
    pathUsed: 'a' | 'b';
    feedbackItems?: Array<{
      nodeName: string;
      type: 'added' | 'removed';
      rationale: string;
      resolution: 'applied' | 'disputed' | 'dismissed';
      disputeText?: string;
      disputeOutcome?: 'concede' | 'maintain';
      disputeResponse?: string;
    }>;
    pathARefinementText?: string;
    overallAssessment?: string;
    canvasLayout?: Array<{
      nodeName: string;
      layer: string;
      position: number;
      connections: string[];
    }>;
  };
}

// App Evaluator types (Level 5 — new toolkit page)
export interface AppEvaluatorInputs {
  appDescription: string;
  problemAndUsers: string;
  dataAndContent: string;
  refinement_context?: string;
}

export interface DesignScoreCriteria {
  score: number;
  assessment: string;
}

export interface DesignScore {
  overall_score: number;
  verdict: string;
  rationale: string;
  criteria: {
    user_clarity: DesignScoreCriteria;
    data_architecture: DesignScoreCriteria;
    personalisation: DesignScoreCriteria;
    technical_feasibility: DesignScoreCriteria;
    scalability: DesignScoreCriteria;
  };
}

export interface ArchitectureComponent {
  name: string;
  description: string;
  tools: string[];
  level_connection: number;
  priority: 'essential' | 'recommended' | 'optional';
}

export interface ImplementationStep {
  phase: string;
  description: string;
  tasks: string[];
  duration_estimate: string;
  dependencies: string[];
}

export interface RiskItem {
  name: string;
  severity: 'high' | 'medium' | 'low';
  description: string;
  mitigation: string;
}

export interface MatrixPlacement {
  technical_complexity: number;  // 0-100
  business_impact: number;       // 0-100
  quadrant: 'Quick Win' | 'Strategic Investment' | 'Nice to Have' | 'Rethink';
  quadrant_description: string;
}

export interface AppEvaluatorResult {
  design_score: DesignScore;
  matrix_placement: MatrixPlacement;
  architecture: {
    summary: string;
    components: ArchitectureComponent[];
  };
  implementation_plan: {
    summary: string;
    steps: ImplementationStep[];
  };
  risks_and_gaps: {
    summary: string;
    items: RiskItem[];
  };
  refinement_questions?: string[];
}

// App Evaluator — Build Plan (Step 3)
export interface AppBuildPlanInputs {
  appDescription: string;
  problemAndUsers: string;
  architecture_summary: string;
  design_score_summary: string;
  matrix_quadrant: string;
  tech_stack: {
    hosting: string;
    database_auth: string;
    ai_engine: string;
  };
  refinement_context?: string;
}

export interface BuildPlanPhase {
  phase: string;
  description: string;
  tasks: string[];
  duration_estimate: string;
  dependencies: string[];
  tech_stack_notes: string;
}

export interface AppBuildPlanResult {
  build_plan_summary: string;
  implementation_phases: BuildPlanPhase[];
  architecture_components: ArchitectureComponent[];
  risks_and_gaps: {
    summary: string;
    items: RiskItem[];
  };
  stack_integration_notes: string;
  getting_started: string[];
  refinement_questions?: string[];
}

// Product Architecture types (Level 5)
export type ToolClassification = 'essential' | 'recommended' | 'optional';

export interface ToolAnalysisResult {
  classification: ToolClassification;
  forYourProject: string;
  howToApproach: string;
  tips: string[];
  levelConnection: string;
  connectedLevels: number[];
}

export interface ProductArchitectureAnswers {
  appDescription?: string;
  problemAndUsers?: string;
  dataAndContent?: string;
  technicalLevel?: string;
}

// Learning Pathway Generator types
export type LevelDepth = 'full' | 'fast-track' | 'awareness' | 'skip';

export interface PathwayFormData {
  role: string;
  function: string;
  functionOther: string;
  seniority: string;
  aiExperience: string;
  ambition: string;
  challenge: string;
  availability: string;
  experienceDescription: string;
  goalDescription: string;
}

export interface PathwayLevelResult {
  depth: 'full' | 'fast-track';
  projectTitle: string;
  projectDescription: string;
  deliverable: string;
  challengeConnection: string;
  sessionFormat: string;
  resources: { name: string; note: string }[];
}

export interface PathwayApiResponse {
  pathwaySummary: string;
  totalEstimatedWeeks: number;
  levels: Partial<Record<string, PathwayLevelResult>>;
}

// Persona Carousel types
export interface PersonaPathwayLevel {
  level: string;
  depth: 'full' | 'fast-track' | 'awareness' | 'skip';
  color: string;
}

export interface PersonaCardData {
  id: number;
  title: string;
  accentColor: string;
  front: {
    whereIAm: string;
    whereImGoing: string;
  };
  back: {
    pathway: PersonaPathwayLevel[];
    projectTitle: string;
    projectDescription: string;
    estimatedJourney: string;
  };
}

// App Designer types (Level 4)
export type DashboardStepStatus = 'pending' | 'active' | 'completed';

export interface DashboardBrief {
  // Group 1: Context & Purpose
  q1_purpose: string;       // What does the app/tool need to do?
  q2_audience: string;       // Who are the target users?
  q3_type: string;           // Open text: describe the type of app/tool
  // Group 2: Features & Data
  q4_metrics: string;        // Key features, screens, or metrics to display
  q5_dataSources: string[];  // Where data comes from (APIs, databases, user input, etc.)
  q5_otherSource: string;
  q6_frequency: string;
  // Group 3: Inspiration & Style (optional)
  q7_visualStyle: string;
  q8_colorScheme: string;
  q8_customColor: string;
  q9_inspirationUrls: string[];
  q9_uploadedImages: string[];
}

export interface RefinementSettings {
  layoutColumns: string;
  headerStyle: string;
  widgetDensity: number;
  colorOverride: string;
  chartStyle: string;
  darkMode: boolean;
  additionalMetrics: string[];
  additionalSections: string[];
  freeTextFeedback: string;
}

export interface DashboardVersion {
  version: number;
  htmlContent: string;
  imagePrompt: string;
  jsonPrompt: object;
  timestamp: number;
}

export interface PRDReadinessCriteria {
  label: string;
  score: number;
  assessment: string;
}

export interface PRDReadiness {
  overall_score: number;
  verdict: string;
  rationale: string;
  criteria: Record<string, PRDReadinessCriteria>;
}

export interface NewPRDResult {
  prd_content: string;
  sections: Record<string, string>;
  readiness: PRDReadiness;
  refinement_questions: string[];
  screen_map?: string;
  data_model?: string;
}
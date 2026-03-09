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

// Prompt Engineering Playground types
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
}

// App Evaluator types (Level 5 — new toolkit page)
export interface AppEvaluatorInputs {
  appDescription: string;
  problemAndUsers: string;
  dataAndContent: string;
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

export interface AppEvaluatorResult {
  design_score: DesignScore;
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

// Dashboard Designer types (Level 4)
export type DashboardStepStatus = 'pending' | 'active' | 'completed';

export interface DashboardBrief {
  // Group 1: Context & Purpose
  q1_purpose: string;
  q2_audience: string;
  q3_type: string;
  // Group 2: Data & Metrics
  q4_metrics: string;
  q5_dataSources: string[];
  q5_otherSource: string;
  q6_frequency: string;
  // Group 3: Inspiration & Style
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

export interface NewPRDResult {
  prd_content: string;
  sections: Record<string, string>;
}
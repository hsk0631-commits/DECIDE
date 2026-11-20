export type DecisionCategory = "daily" | "shopping" | "car" | "career" | "travel" | "relationship" | "custom";

export interface DecisionOption {
  id: string;
  title: string;
  description: string;
  pros: string[];
  cons: string[];
}

export interface DecisionCriterion {
  id: string;
  title: string;
  weight: number;
  description: string;
}

export type RequirementStatus = "fulfilled" | "unfulfilled" | "unknown";

export interface DecisionRequirement {
  id: string;
  title: string;
  status: RequirementStatus;
  description?: string;
}

export type ScoreValue = number | null;
export type ScoreMap = Record<string, Record<string, ScoreValue>>;

export type RecommendationStatus = "RECOMMENDED" | "CONDITIONAL" | "INSUFFICIENT_DATA" | "NO_VALID_OPTION";

export interface OptionScore {
  optionId: string;
  totalScore: number;
  weightedScore: number;
  isTie?: boolean;
  hasUnknown?: boolean;
  hasUnfulfilled?: boolean;
}

export interface DecisionResult {
  recommendedOptionId: string;
  status: RecommendationStatus;
  scores: OptionScore[];
  summary: string;
  createdAt: string;
  excludedOptionIds?: string[];
  warnings?: string[];
}

export interface OptionRequirements {
  [optionId: string]: {
    [requirementId: string]: "fulfilled" | "unfulfilled" | "unknown";
  };
}

export interface DecisionReview {
  actualChoiceId: string;
  satisfactionScore: number;
  reflectionText: string;
  reviewedAt: string;
}

export interface DecisionProject {
  id: string;
  title: string;
  category: DecisionCategory;
  status: "in_progress" | "completed";
  createdAt: string;
  updatedAt: string;
  options: DecisionOption[];
  criteria: DecisionCriterion[];
  requirements: DecisionRequirement[];
  scores: ScoreMap;
  result?: DecisionResult;
  review?: DecisionReview;
}

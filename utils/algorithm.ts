// DECIDE Decision Algorithm
// Handles per-option requirements, scoring, and recommendation logic

import {
  DecisionProject,
  DecisionResult,
  OptionScore,
  OptionRequirements,
} from '../types/decision';

/**
 * Migrates a project to ensure optionRequirements is properly initialized.
 * Backfills missing data by copying project-level requirement statuses.
 */
export function migrateProject(
  project: DecisionProject
): DecisionProject & { optionRequirements: OptionRequirements } {
  const typedProject = project as DecisionProject & { optionRequirements?: OptionRequirements };

  // If already has optionRequirements with at least one entry, cast and use it directly
  if (typedProject.optionRequirements && Object.keys(typedProject.optionRequirements).length > 0) {
    return typedProject as unknown as DecisionProject & { optionRequirements: OptionRequirements };
  }

  // Initialize empty optionRequirements and backfill from project-level requirements
  const migratedOptionRequirements: OptionRequirements = {};

  for (const option of project.options) {
    migratedOptionRequirements[option.id] = {};
    for (const requirement of project.requirements) {
      migratedOptionRequirements[option.id][requirement.id] = requirement.status;
    }
  }

  return {
    ...project,
    optionRequirements: migratedOptionRequirements,
  };
}

/**
 * Calculates the recommendation for a decision project.
 */
export function calculateDecision(project: DecisionProject): DecisionResult {
  const migrated = migrateProject(project);
  const { optionRequirements } = migrated;

  const result: DecisionResult = {
    recommendedOptionId: '',
    status: 'INSUFFICIENT_DATA',
    scores: [],
    summary: '',
    createdAt: new Date().toISOString(),
    excludedOptionIds: [],
    warnings: [],
  };

  // Step 1: Evaluate requirements for each option
  type OptionEval = {
    optionId: string;
    hasUnfulfilled: boolean;
    hasUnknown: boolean;
    unknownWarnings: string[];
  };

  const evals: OptionEval[] = project.options.map((option) => {
    const optReqs = optionRequirements[option.id] || {};
    let hasUnfulfilled = false;
    let hasUnknown = false;
    const unknownWarnings: string[] = [];

    for (const req of project.requirements) {
      const status = optReqs[req.id];
      if (status === 'unfulfilled') {
        hasUnfulfilled = true;
      } else if (status === 'unknown') {
        hasUnknown = true;
        unknownWarnings.push(`"${req.title}" 조건 확인 필요`);
      }
    }

    return {
      optionId: option.id,
      hasUnfulfilled,
      hasUnknown,
      unknownWarnings,
    };
  });

  // Step 2: Filter out unfulfilled options
  const validEvals = evals.filter((e) => !e.hasUnfulfilled);
  const excludedOptionIds = evals
    .filter((e) => e.hasUnfulfilled)
    .map((e) => e.optionId);

  result.excludedOptionIds = excludedOptionIds;

  // Add warnings for unknown conditions
  for (const eval_ of evals) {
    result.warnings = [...(result.warnings || []), ...eval_.unknownWarnings];
  }

  // Step 3: Check if any valid options remain
  if (validEvals.length === 0) {
    result.status = 'NO_VALID_OPTION';
    result.summary = '모든 선택지가 필수 조건을 충족하지 않습니다.';
    return result;
  }

  // Step 4: Calculate scores for valid options
  const scores: OptionScore[] = [];
  let totalEvaluatedCriteria = 0;
  let totalPossibleCriteria = 0;

  for (const eval_ of validEvals) {
    const optionScores = project.scores[eval_.optionId] || {};
    let weightedSum = 0;
    let scoreCount = 0;
    let evalWeightedSum = 0;

    for (const criterion of project.criteria) {
      const score = optionScores[criterion.id];
      if (score !== null && score !== undefined) {
        weightedSum += score * criterion.weight;
        evalWeightedSum += criterion.weight;
        scoreCount++;
      }
    }

    const maxPossible = 5;
    const avgScore = evalWeightedSum > 0 ? weightedSum / evalWeightedSum : 0;
    const weightedScore = Math.round((avgScore / maxPossible) * 100 * 10) / 10;
    const totalScore = Math.round(avgScore * 10) / 10;

    scores.push({
      optionId: eval_.optionId,
      totalScore,
      weightedScore,
      hasUnknown: eval_.hasUnknown,
    });

    totalEvaluatedCriteria += scoreCount;
    totalPossibleCriteria += project.criteria.length;
  }

  // Sort by weightedScore descending
  scores.sort((a, b) => b.weightedScore - a.weightedScore);

  // Mark ties
  if (scores.length > 1) {
    const topScore = scores[0].weightedScore;
    for (let i = 1; i < scores.length; i++) {
      const diff = Math.abs(scores[i].weightedScore - topScore);
      if (diff < 0.001) {
        scores[i].isTie = true;
      }
    }
  }

  // Step 5: Determine status based on data sufficiency
  const dataRatio =
    totalPossibleCriteria > 0 ? totalEvaluatedCriteria / totalPossibleCriteria : 0;

  if (dataRatio < 0.5) {
    result.status = 'INSUFFICIENT_DATA';
    result.summary = `평가 데이터가 부족합니다. 현재 ${Math.round(dataRatio * 100)}%만 평가되었습니다.`;
    result.scores = scores;
    return result;
  }

  // Step 6: Determine recommendation status
  if (scores.length === 1) {
    result.recommendedOptionId = scores[0].optionId;
    result.status = 'RECOMMENDED';
    result.summary = `"${
      project.options.find((o) => o.id === scores[0].optionId)?.title || ''
    }"를 추천합니다.`;
  } else {
    const topScore = scores[0].weightedScore;
    const secondScore = scores[1]?.weightedScore ?? topScore;
    const diffPercent = topScore > 0 ? ((topScore - secondScore) / topScore) * 100 : 0;

    if (diffPercent <= 5) {
      result.status = 'CONDITIONAL';
      const topTitle =
        project.options.find((o) => o.id === scores[0].optionId)?.title || '';
      result.summary = `"${topTitle}"를 제안하지만 점수 차이가 매우 근접합니다.`;
      result.warnings?.push('상위 두 옵션 간 점수 차이가 5% 이내입니다.');
    } else {
      result.recommendedOptionId = scores[0].optionId;
      result.status = 'RECOMMENDED';
      const topTitle =
        project.options.find((o) => o.id === scores[0].optionId)?.title || '';
      result.summary = `"${topTitle}"를 추천합니다.`;
    }
  }

  result.scores = scores;
  return result;
}
"use client";

import { useState, useCallback, Suspense } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { DecisionProject, RequirementStatus, ScoreMap, DecisionOption } from "@/types/decision";
import { getProjectById, saveProject } from "@/utils/storage";
import { calculateDecision } from "@/utils/algorithm";
import { DECISION_TEMPLATES } from "@/constants/templates";

function DetailPageContent() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [project, setProject] = useState<DecisionProject | null>(() => getProjectById(id));
  const [loading] = useState(false);
  const [notFound] = useState(() => !getProjectById(id));
  const [result, setResult] = useState<ReturnType<typeof calculateDecision> | null>(() => {
    const loaded = getProjectById(id);
    return loaded ? calculateDecision(loaded) : null;
  });

  // 점수 변경 시 자동 저장
  const handleScoreChange = useCallback((optionId: string, criterionId: string, value: number | null) => {
    if (!project) return;
    
    const newScores: ScoreMap = {
      ...project.scores,
      [optionId]: {
        ...project.scores[optionId],
        [criterionId]: value
      }
    };

    const updatedProject = {
      ...project,
      scores: newScores,
      updatedAt: new Date().toISOString()
    };

    setProject(updatedProject);
    setResult(calculateDecision(updatedProject));
    saveProject(updatedProject);
  }, [project]);

  // 필수 조건 상태 변경
  const handleRequirementChange = useCallback((requirementId: string, status: RequirementStatus) => {
    if (!project) return;
    
    const updatedRequirements = project.requirements.map(req =>
      req.id === requirementId ? { ...req, status } : req
    );

    const updatedProject = {
      ...project,
      requirements: updatedRequirements,
      updatedAt: new Date().toISOString()
    };

    setProject(updatedProject);
    setResult(calculateDecision(updatedProject));
    saveProject(updatedProject);
  }, [project]);

  // 기준 가중치 변경
  const handleWeightChange = useCallback((criterionId: string, weight: number) => {
    if (!project) return;
    
    const updatedCriteria = project.criteria.map(c =>
      c.id === criterionId ? { ...c, weight: Math.max(1, Math.min(5, weight)) } : c
    );

    const updatedProject = {
      ...project,
      criteria: updatedCriteria,
      updatedAt: new Date().toISOString()
    };

    setProject(updatedProject);
    setResult(calculateDecision(updatedProject));
    saveProject(updatedProject);
  }, [project]);

  // 선택지 추가
  const handleAddOption = useCallback(() => {
    if (!project) return;
    const newOption: DecisionOption = {
      id: crypto.randomUUID(),
      title: "새 선택지",
      description: "",
      pros: [],
      cons: []
    };
    const updatedProject = {
      ...project,
      options: [...project.options, newOption],
      updatedAt: new Date().toISOString()
    };
    setProject(updatedProject);
    saveProject(updatedProject);
  }, [project]);

  // 선택지 삭제
  const handleDeleteOption = useCallback((optionId: string) => {
    if (!project) return;
    if (project.options.length <= 1) return;
    const updatedProject = {
      ...project,
      options: project.options.filter(o => o.id !== optionId),
      updatedAt: new Date().toISOString()
    };
    setProject(updatedProject);
    saveProject(updatedProject);
  }, [project]);

  // 완료 처리
  const handleComplete = useCallback(() => {
    if (!project || !result) return;
    const updatedProject = {
      ...project,
      status: "completed" as const,
      result,
      updatedAt: new Date().toISOString()
    };
    setProject(updatedProject);
    saveProject(updatedProject);
    router.push("/");
  }, [project, result, router]);

  if (loading) {
    return (
      <main className="min-h-screen bg-[#F8F9FC] text-[#202437] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-500">불러오는 중...</p>
        </div>
      </main>
    );
  }

  if (notFound || !project) {
    return (
      <main className="min-h-screen bg-[#F8F9FC] text-[#202437]">
        <div className="mx-auto max-w-2xl px-6 py-20 text-center">
          <Link 
            href="/" 
            className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-700 mb-8"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            홈으로 돌아가기
          </Link>
          <div className="rounded-2xl border border-gray-200 bg-white p-12">
            <div className="text-6xl mb-4">🔍</div>
            <h1 className="text-2xl font-bold text-gray-900">고민을 찾을 수 없습니다</h1>
            <p className="mt-2 text-gray-500">요청하신 고민이 삭제되었거나 존재하지 않습니다.</p>
            <Link 
              href="/" 
              className="mt-6 inline-block rounded-lg bg-indigo-600 px-6 py-3 text-white font-medium hover:bg-indigo-700"
            >
              홈으로 돌아가기
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const categoryName = DECISION_TEMPLATES[project.category]?.name || "직접 설정";
  const evaluatedCount = Object.values(project.scores).flatMap(o => Object.values(o)).filter(v => v !== null).length;
  const totalPossible = project.options.length * project.criteria.length;
  const progress = totalPossible > 0 ? Math.round((evaluatedCount / totalPossible) * 100) : 0;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "RECOMMENDED": return "bg-green-50 text-green-700 border-green-200";
      case "CONDITIONAL": return "bg-yellow-50 text-yellow-700 border-yellow-200";
      case "INSUFFICIENT_DATA": return "bg-gray-50 text-gray-700 border-gray-200";
      case "NO_VALID_OPTION": return "bg-red-50 text-red-700 border-red-200";
      default: return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "RECOMMENDED": return "추천";
      case "CONDITIONAL": return "조건부 추천";
      case "INSUFFICIENT_DATA": return "데이터 부족";
      case "NO_VALID_OPTION": return "추천 불가";
      default: return status;
    }
  };

  return (
    <main className="min-h-screen bg-[#F8F9FC] text-[#202437]">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-4">
          <Link 
            href="/" 
            className="text-gray-500 hover:text-gray-700 p-2"
            aria-label="홈으로"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div>
            <div className="text-2xl font-black tracking-tight">
              DECIDE<span className="text-indigo-600">.</span>
            </div>
            <div className="text-sm text-gray-500">{categoryName}</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/stats" className="text-sm text-gray-500 hover:text-indigo-600 font-medium">통계 보기</Link>
          {project.status === "in_progress" && (
            <button
              onClick={handleComplete}
              className="rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700"
            >
              결정 완료하기
            </button>
          )}
          {project.status === "completed" && (
            <Link
              href={"/review/" + project.id}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
            >
              회고 작성/보기
            </Link>
          )}
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-6 pb-20">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{project.title}</h1>
          <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-gray-500">
            <span>{project.options.length}개 선택지</span>
            <span>·</span>
            <span>{project.criteria.length}개 평가 기준</span>
            <span>·</span>
            <span>{project.requirements.length}개 필수 조건</span>
            <span>·</span>
            <span>평가 진행률 {progress}%</span>
          </div>
        </div>

        {result && (
          <div className="mb-8 rounded-2xl border bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">실시간 추천 결과</h2>
              <span className={"inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold border " + getStatusColor(result.status)}>
                {getStatusLabel(result.status)}
              </span>
            </div>
            
            <div className="mb-4 p-4 rounded-xl bg-indigo-50">
              <p className="font-medium text-indigo-800">{result.summary}</p>
              <p className="mt-2 text-sm text-indigo-600">
                ※ 이 결과는 입력된 기준과 점수에 기반한 상대적 적합도입니다. 정답이나 성공 확률이 아닙니다.
              </p>
            </div>

            <div className="space-y-2">
              {result.scores.map((score, idx) => {
                const option = project.options.find(o => o.id === score.optionId);
                const isBest = idx === 0;
                return (
                  <div 
                    key={score.optionId} 
                    className={"flex items-center justify-between p-4 rounded-xl transition " + (isBest ? "bg-green-50 border border-green-200" : "bg-gray-50 border border-gray-100")}
                  >
                    <div className="flex items-center gap-3">
                      {score.isTie && (
                        <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-yellow-100 text-yellow-800">
                          박빙
                        </span>
                      )}
                      <span className="font-medium text-gray-900">{option?.title}</span>
                      {isBest && (
                        <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-green-100 text-green-800">
                          1위
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span>가중치 합계: <span className="font-bold">{score.weightedScore.toFixed(1)}</span></span>
                      <span>평균 점수: <span className="font-bold">{project.criteria.length > 0 ? (score.totalScore / project.criteria.length).toFixed(1) : "0"}</span></span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="mb-8">
          <h2 className="text-lg font-bold mb-4">선택지별 평가 점수 (1~5점)</h2>
          <p className="text-sm text-gray-500 mb-4">
            각 기준의 중요도(가중치)와 선택지별 점수를 입력하세요. 미평가 항목은 빈 칸으로 둡니다.
          </p>
          
          <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="w-40 px-4 py-3 text-left font-medium text-gray-700">선택지 / 기준</th>
                  {project.criteria.map(criterion => (
                    <th key={criterion.id} className="px-4 py-3 text-center font-medium text-gray-700">
                      <div>{criterion.title}</div>
                      <div className="flex items-center justify-center gap-1 mt-1">
                        <span className="text-xs text-gray-500">중요도</span>
                        <input
                          type="number"
                          min="1"
                          max="5"
                          value={criterion.weight}
                          onChange={(e) => handleWeightChange(criterion.id, parseInt(e.target.value) || 1)}
                          className="w-12 px-2 py-1 text-center text-xs border border-gray-300 rounded focus:border-indigo-500 focus:outline-none"
                        />
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {project.options.map((option, optIdx) => (
                  <tr key={option.id} className={optIdx % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                    <td className="px-4 py-3 font-medium text-gray-900 border-b border-gray-100">
                      {option.title}
                    </td>
                    {project.criteria.map(criterion => (
                      <td key={criterion.id} className="px-4 py-3 text-center border-b border-gray-100">
                        <input
                          type="number"
                          min="1"
                          max="5"
                          step="1"
                          value={project.scores[option.id]?.[criterion.id] ?? ""}
                          onChange={(e) => {
                            const val = e.target.value === "" ? null : parseInt(e.target.value);
                            if (val !== null && (val < 1 || val > 5)) return;
                            handleScoreChange(option.id, criterion.id, val);
                          }}
                          onBlur={(e) => {
                            const val = e.target.value === "" ? null : parseInt(e.target.value);
                            if (val !== null && (val < 1 || val > 5)) {
                              handleScoreChange(option.id, criterion.id, null);
                            }
                          }}
                          className="w-16 px-2 py-2 text-center border border-gray-300 rounded focus:border-indigo-500 focus:outline-none"
                          placeholder="미평가"
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {project.requirements.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-bold mb-4">필수 조건 체크</h2>
            <p className="text-sm text-gray-500 mb-4">
              미충족인 조건이 있는 선택지는 추천에서 제외되거나 조건부 추천이 됩니다.
            </p>
            <div className="space-y-3">
              {project.requirements.map(req => (
                <div 
                  key={req.id} 
                  className="flex items-center justify-between p-4 rounded-xl border border-gray-200 bg-white"
                >
                  <div className="flex items-center gap-3">
                    <div className="text-sm font-medium text-gray-900">{req.title}</div>
                    {req.description && <div className="text-xs text-gray-500">{req.description}</div>}
                  </div>
                  <select
                    value={req.status}
                    onChange={(e) => handleRequirementChange(req.id, e.target.value as RequirementStatus)}
                    className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
                  >
                    <option value="unknown">미확인</option>
                    <option value="fulfilled">충족</option>
                    <option value="unfulfilled">미충족</option>
                  </select>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mb-8">
          <h2 className="text-lg font-bold mb-4">선택지 관리</h2>
          <div className="space-y-3">
            {project.options.map((option) => (
              <div key={option.id} className="flex items-center justify-between p-4 rounded-xl border border-gray-200 bg-white">
                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    value={option.title}
                    onChange={(e) => {
                      if (!project) return;
                      const updated = project.options.map(o => o.id === option.id ? { ...o, title: e.target.value } : o);
                      const updatedProject = { ...project, options: updated, updatedAt: new Date().toISOString() };
                      setProject(updatedProject);
                      saveProject(updatedProject);
                    }}
                    className="px-3 py-2 border border-gray-300 rounded focus:border-indigo-500 focus:outline-none"
                  />
                  <span className="text-sm text-gray-500">{option.pros.length}장점 · {option.cons.length}단점</span>
                </div>
                <button
                  onClick={() => handleDeleteOption(option.id)}
                  disabled={project.options.length <= 1}
                  className="text-red-500 hover:text-red-700 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  삭제
                </button>
              </div>
            ))}
            <button
              onClick={handleAddOption}
              className="w-full rounded-xl border-2 border-dashed border-gray-300 py-3 text-gray-500 hover:border-indigo-400 hover:text-indigo-600 transition"
            >
              + 선택지 추가
            </button>
          </div>
        </div>

        <footer className="border-t border-gray-200 pt-6 text-center text-sm text-gray-400">
          DECIDE © 2026. Make a choice you understand.
        </footer>
      </section>
    </main>
  );
}

export default function DetailPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#F8F9FC] flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>}>
      <DetailPageContent />
    </Suspense>
  );
}

"use client";

import { useState, useCallback, Suspense } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { DecisionProject } from "@/types/decision";
import { getProjectById, saveProject } from "@/utils/storage";
import { calculateDecision } from "@/utils/algorithm";
import { DECISION_TEMPLATES } from "@/constants/templates";

function ReviewPageContent() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [project, setProject] = useState<DecisionProject | null>(() => getProjectById(id));
  const [loading] = useState(false);
  const [notFound] = useState(() => !getProjectById(id));
  const [result] = useState<ReturnType<typeof calculateDecision> | null>(() => {
    const loaded = getProjectById(id);
    return loaded ? calculateDecision(loaded) : null;
  });
  const [satisfaction, setSatisfaction] = useState(() => project?.review?.satisfactionScore || 3);
  const [reflection, setReflection] = useState(() => project?.review?.reflectionText || "");
  const [selectedOptionId, setSelectedOptionId] = useState<string>(() => project?.review?.actualChoiceId || result?.recommendedOptionId || "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSaveReview = useCallback(async () => {
    if (!project || !selectedOptionId) return;
    
    setSaving(true);
    
    const review = {
      actualChoiceId: selectedOptionId,
      satisfactionScore: satisfaction,
      reflectionText: reflection,
      reviewedAt: new Date().toISOString()
    };

    const updatedProject = {
      ...project,
      status: "completed" as const,
      review,
      updatedAt: new Date().toISOString()
    };

    setProject(updatedProject);
    saveProject(updatedProject);
    setSaving(false);
    setSaved(true);
    
    setTimeout(() => setSaved(false), 2000);
  }, [project, selectedOptionId, satisfaction, reflection]);

  const handleBackToHome = useCallback(() => {
    router.push("/");
  }, [router]);

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

  const satisfactionLabels = ["매우 불만족", "불만족", "보통", "만족", "매우 만족"];

  return (
    <main className="min-h-screen bg-[#F8F9FC] text-[#202437]">
      <header className="mx-auto flex max-w-4xl items-center justify-between px-6 py-6">
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
            <div className="text-sm text-gray-500">{categoryName} · 회고</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/stats" className="text-sm text-gray-500 hover:text-indigo-600 font-medium">통계 보기</Link>
        </div>
      </header>

      <section className="mx-auto max-w-4xl px-6 pb-20">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{project.title}</h1>
          <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-gray-500">
            <span>{project.options.length}개 선택지</span>
            <span>·</span>
            <span>{project.criteria.length}개 평가 기준</span>
            {project.review && (
              <>
                <span>·</span>
                <span className="text-green-600 font-medium">회고 완료</span>
              </>
            )}
          </div>
        </div>

        {result && (
          <div className="mb-8 rounded-2xl border bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">당시 추천 결과</h2>
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
                          당시 1위 추천
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span>가중치 합계: <span className="font-bold">{score.weightedScore.toFixed(1)}</span></span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="mb-8">
          <h2 className="text-xl font-bold mb-6">결정 회고 작성</h2>
          <p className="text-sm text-gray-500 mb-6">
            실제 어떤 선택을 했는지, 결과에 얼마나 만족하는지 기록해보세요. 이 데이터는 향후 더 나은 결정을 내리는 데 도움이 됩니다.
          </p>

          <div className="space-y-6">
            <div className="rounded-2xl border border-gray-200 bg-white p-6">
              <h3 className="text-lg font-bold mb-4">1. 실제 선택한 옵션</h3>
              <div className="space-y-3">
                {project.options.map(option => (
                  <label 
                    key={option.id} 
                    className={"flex items-center p-4 rounded-xl border-2 transition cursor-pointer " + (selectedOptionId === option.id ? "border-indigo-500 bg-indigo-50" : "border-gray-200 hover:border-indigo-300")}
                  >
                    <input
                      type="radio"
                      name="actualChoice"
                      value={option.id}
                      checked={selectedOptionId === option.id}
                      onChange={() => setSelectedOptionId(option.id)}
                      className="w-5 h-5 text-indigo-600 border-gray-300 focus:ring-indigo-500"
                    />
                    <span className="ml-4 font-medium text-gray-900">{option.title}</span>
                    {result?.recommendedOptionId === option.id && (
                      <span className="ml-auto inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-green-100 text-green-800">
                        당시 추천
                      </span>
                    )}
                  </label>
                ))}
              </div>
              {!selectedOptionId && (
                <p className="mt-3 text-sm text-red-500">실제 선택한 옵션을 선택해주세요.</p>
              )}
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-6">
              <h3 className="text-lg font-bold mb-4">2. 만족도 평가 (1~5점)</h3>
              <p className="text-sm text-gray-500 mb-4">이 결정에 대해 현재 얼마나 만족하시나요?</p>
              <div className="flex items-center gap-4">
                {[1,2,3,4,5].map(score => (
                  <button
                    key={score}
                    onClick={() => setSatisfaction(score)}
                    className={"flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition " + (satisfaction === score ? "border-indigo-500 bg-indigo-50" : "border-gray-200 hover:border-indigo-300")}
                  >
                    <span className={"text-2xl font-bold " + (satisfaction === score ? "text-indigo-600" : "text-gray-400")}>{score}</span>
                    <span className="text-xs text-gray-500">{satisfactionLabels[score - 1]}</span>
                  </button>
                ))}
              </div>
              <div className="mt-4 h-2 bg-gray-200 rounded overflow-hidden">
                <div 
                  className="h-full bg-indigo-500 transition-all duration-300" 
                  style={{ width: satisfaction / 5 * 100 + "%" }}
                ></div>
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-6">
              <h3 className="text-lg font-bold mb-4">3. 결정 회고 (자유 서술)</h3>
              <p className="text-sm text-gray-500 mb-4">
                결정 과정, 결과, 배운 점, 아쉬운 점 등을 자유롭게 적어보세요.
              </p>
              <textarea
                value={reflection}
                onChange={(e) => setReflection(e.target.value)}
                placeholder="이 결정을 내린 이유, 실제 결과, 다음에 참고할 점 등을 적어보세요..." 
                rows={6}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:border-indigo-500 focus:outline-none resize-none"
              ></textarea>
              <div className="mt-2 text-right text-sm text-gray-500">
                {reflection.length} / 2000자
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleSaveReview}
                disabled={!selectedOptionId || saving}
                className="flex-1 rounded-lg bg-indigo-600 px-6 py-3 font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? "저장 중..." : "회고 저장하기"}
              </button>
              <button
                onClick={handleBackToHome}
                className="flex-1 rounded-lg border border-gray-300 px-6 py-3 font-medium text-gray-700 hover:bg-gray-50"
              >
                홈으로 돌아가기
              </button>
            </div>

            {saved && (
              <div className="rounded-lg bg-green-50 border border-green-200 p-4 text-center text-green-700">
                ✅ 회고가 저장되었습니다!
              </div>
            )}
          </div>
        </div>

        {project.review && (
          <div className="mb-8 rounded-2xl border border-green-200 bg-green-50 p-6">
            <h3 className="text-lg font-bold text-green-800 mb-4">✅ 회고 완료됨</h3>
            <div className="space-y-3 text-sm">
              <p><span className="font-medium">실제 선택:</span> {project.options.find(o => o.id === project.review?.actualChoiceId)?.title || "-"}</p>
              <p><span className="font-medium">만족도:</span> {project.review?.satisfactionScore}/5점</p>
              <p><span className="font-medium">작성일:</span> {new Date(project.review?.reviewedAt || "").toLocaleDateString("ko-KR")}</p>
              {project.review?.reflectionText && (
                <div className="mt-4 p-4 rounded-lg bg-white">
                  <p className="font-medium text-gray-900">{project.review.reflectionText}</p>
                </div>
              )}
            </div>
            <button
              onClick={() => {
                if (!project) return;
                const updatedProject = { ...project, review: undefined, updatedAt: new Date().toISOString() };
                setProject(updatedProject);
                saveProject(updatedProject);
              }}
              className="mt-4 text-sm text-green-700 hover:underline"
            >
              회고 수정하기
            </button>
          </div>
        )}

        <footer className="border-t border-gray-200 pt-6 text-center text-sm text-gray-400">
          DECIDE © 2026. Make a choice you understand.
        </footer>
      </section>
    </main>
  );
}

export default function ReviewPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#F8F9FC] flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>}>
      <ReviewPageContent />
    </Suspense>
  );
}

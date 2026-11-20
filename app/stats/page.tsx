"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { DecisionProject, DecisionCategory } from "@/types/decision";
import { loadProjects } from "@/utils/storage";
import { DECISION_TEMPLATES } from "@/constants/templates";

function StatsPageContent() {
  const [projects, setProjects] = useState<DecisionProject[]>(() => loadProjects());
  const [activeTab, setActiveTab] = useState<"overview" | "categories" | "trends">("overview");

  useEffect(() => {
    const handleFocus = () => setProjects(loadProjects());
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, []);

  const completedProjects = projects.filter(p => p.status === "completed");
  const inProgressProjects = projects.filter(p => p.status === "in_progress");

  const totalDecisions = completedProjects.length;
  const avgSatisfaction = totalDecisions > 0
    ? (completedProjects.reduce((sum, p) => sum + (p.review?.satisfactionScore || 0), 0) / totalDecisions).toFixed(1)
    : "-";
  
  const matchCount = completedProjects.filter(p => 
    p.review && p.result && p.review.actualChoiceId === p.result.recommendedOptionId
  ).length;
  const matchRate = totalDecisions > 0 ? Math.round((matchCount / totalDecisions) * 100) : 0;

  const categoryStats = Object.entries(DECISION_TEMPLATES).map(([key, tmpl]) => {
    const catProjects = completedProjects.filter(p => p.category === key);
    const count = catProjects.length;
    const avgSat = count > 0
      ? (catProjects.reduce((sum, p) => sum + (p.review?.satisfactionScore || 0), 0) / count).toFixed(1)
      : "-";
    return { key, name: tmpl.name, count, avgSat };
  }).filter(c => c.count > 0);

  const monthlyData: { month: string; count: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const key = d.toLocaleDateString("ko-KR", { year: "numeric", month: "short" });
    const count = completedProjects.filter(p => {
      const pd = new Date(p.review?.reviewedAt || p.updatedAt);
      return pd.getFullYear() === d.getFullYear() && pd.getMonth() === d.getMonth();
    }).length;
    monthlyData.push({ month: key, count });
  }

  const satisfactionDist = [1,2,3,4,5].map(score => ({
    score,
    label: ["매우 불만족", "불만족", "보통", "만족", "매우 만족"][score-1],
    count: completedProjects.filter(p => p.review?.satisfactionScore === score).length
  }));

  const maxSatCount = Math.max(...satisfactionDist.map(d => d.count), 1);

  const getCategoryName = (cat: DecisionCategory) => DECISION_TEMPLATES[cat]?.name || "직접 설정";

  return (
    <main className="min-h-screen bg-[#F8F9FC] text-[#202437]">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-4">
          <Link href="/" className="text-gray-500 hover:text-gray-700 p-2" aria-label="홈으로">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </Link>
          <div>
            <div className="text-2xl font-black tracking-tight">DECIDE<span className="text-indigo-600">.</span></div>
            <div className="text-sm text-gray-500">통계 대시보드</div>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-6 pb-20">
        <div className="mb-8 border-b border-gray-200">
          <nav className="flex gap-1" aria-label="통계 탭">
            <button onClick={() => setActiveTab("overview")} className={"px-4 py-3 text-sm font-medium rounded-t-lg border-b-2 transition " + (activeTab === "overview" ? "border-indigo-600 text-indigo-600" : "border-transparent text-gray-500 hover:text-gray-700")}>개요</button>
            <button onClick={() => setActiveTab("categories")} className={"px-4 py-3 text-sm font-medium rounded-t-lg border-b-2 transition " + (activeTab === "categories" ? "border-indigo-600 text-indigo-600" : "border-transparent text-gray-500 hover:text-gray-700")}>분야별</button>
            <button onClick={() => setActiveTab("trends")} className={"px-4 py-3 text-sm font-medium rounded-t-lg border-b-2 transition " + (activeTab === "trends" ? "border-indigo-600 text-indigo-600" : "border-transparent text-gray-500 hover:text-gray-700")}>추이</button>
          </nav>
        </div>

        {activeTab === "overview" && (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
              <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm"><div className="text-sm text-gray-400">완료한 결정</div><div className="mt-2 text-4xl font-bold text-indigo-600">{totalDecisions}</div><div className="mt-1 text-sm text-gray-500">전체 결정 완료 건수</div></div>
              <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm"><div className="text-sm text-gray-400">평균 만족도</div><div className="mt-2 text-4xl font-bold text-green-600">{avgSatisfaction}/5.0</div><div className="mt-1 text-sm text-gray-500">회고 기준 평균 점수</div></div>
              <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm"><div className="text-sm text-gray-400">추천 일치율</div><div className="mt-2 text-4xl font-bold text-amber-600">{matchRate}%</div><div className="mt-1 text-sm text-gray-500">실제 선택 = 추천 비율</div></div>
              <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm"><div className="text-sm text-gray-400">진행 중인 고민</div><div className="mt-2 text-4xl font-bold text-gray-600">{inProgressProjects.length}</div><div className="mt-1 text-sm text-gray-500">아직 평가 중인 결정</div></div>
            </div>

            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm mb-8">
              <h2 className="text-lg font-bold mb-6">만족도 분포</h2>
              <div className="space-y-3">
                {satisfactionDist.map(d => (
                  <div key={d.score} className="flex items-center gap-4">
                    <div className="w-24 text-sm text-gray-600">{d.label}</div>
                    <div className="flex-1 h-6 bg-gray-200 rounded overflow-hidden">
                      <div className="h-full bg-indigo-500 transition-all duration-500" style={{ width: (d.count / maxSatCount) * 100 + "%" }}></div>
                    </div>
                    <div className="w-16 text-right font-medium text-gray-900">{d.count}건</div>
                  </div>
                ))}
              </div>
            </div>

            {completedProjects.length > 0 && (
              <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                <h2 className="text-lg font-bold mb-4">최근 완료된 결정</h2>
                <div className="space-y-3">
                  {completedProjects.sort((a, b) => new Date(b.review?.reviewedAt || b.updatedAt).getTime() - new Date(a.review?.reviewedAt || a.updatedAt).getTime()).slice(0, 5).map(p => (
                    <Link key={p.id} href={"/review/" + p.id} className="flex items-center justify-between p-4 rounded-xl border border-gray-100 hover:bg-gray-50 transition">
                      <div className="flex-1 min-w-0"><h3 className="font-medium text-gray-900 truncate">{p.title}</h3><div className="mt-1 flex items-center gap-2 text-sm text-gray-500"><span>{getCategoryName(p.category)}</span><span>·</span><span>{p.review?.satisfactionScore}/5점</span><span>·</span><span>{new Date(p.review?.reviewedAt || p.updatedAt).toLocaleDateString("ko-KR")}</span></div></div><svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {activeTab === "categories" && (
          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold mb-6">분야별 결정 통계</h2>
            {categoryStats.length > 0 ? (
              <div className="space-y-4">
                {categoryStats.map(cat => (
                  <div key={cat.key} className="p-4 rounded-xl border border-gray-100">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">📋</span>
                        <div><h3 className="font-bold text-gray-900">{cat.name}</h3><p className="text-sm text-gray-500">{cat.count}건 결정 완료 · 평균 만족도 {cat.avgSat}/5.0</p></div>
                      </div>
                      <div className="text-right"><div className="text-2xl font-bold text-indigo-600">{cat.count}</div><div className="text-sm text-gray-500">건</div></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500"><div className="text-4xl mb-3">📊</div><p>아직 완료된 결정이 없습니다.</p></div>
            )}
          </div>
        )}

        {activeTab === "trends" && (
          <>
            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm mb-8">
              <h2 className="text-lg font-bold mb-6">월별 결정 완료 추이</h2>
              <div className="space-y-3">
                {monthlyData.map(d => (
                  <div key={d.month} className="flex items-center gap-4">
                    <div className="w-24 text-sm text-gray-600">{d.month}</div>
                    <div className="flex-1 h-8 bg-gray-200 rounded overflow-hidden">
                      <div className="h-full bg-indigo-500 transition-all duration-500 flex items-center justify-end pr-3 text-white text-xs font-medium" style={{ width: monthlyData.length > 0 ? (d.count / Math.max(...monthlyData.map(m => m.count), 1)) * 100 + "%" : "0%" }}>{d.count > 0 ? d.count + "건" : ""}</div>
                    </div>
                    <div className="w-16 text-right font-medium text-gray-900">{d.count}건</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-bold mb-6">결정 패턴 인사이트</h2>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="p-4 rounded-xl bg-indigo-50 border border-indigo-100"><div className="text-sm text-indigo-700">가장 많이 결정한 분야</div><div className="mt-1 text-xl font-bold text-indigo-900">{categoryStats.length > 0 ? categoryStats.sort((a, b) => b.count - a.count)[0].name : "-"}</div></div>
                <div className="p-4 rounded-xl bg-green-50 border border-green-100"><div className="text-sm text-green-700">가장 만족도가 높은 분야</div><div className="mt-1 text-xl font-bold text-green-900">{categoryStats.length > 0 ? categoryStats.sort((a, b) => parseFloat(b.avgSat) - parseFloat(a.avgSat))[0].name : "-"}</div></div>
                <div className="p-4 rounded-xl bg-amber-50 border border-amber-100"><div className="text-sm text-amber-700">추천 신뢰도</div><div className="mt-1 text-xl font-bold text-amber-900">{matchRate}%</div></div>
              </div>
            </div>
          </>
        )}
      </section>

      <footer className="border-t border-gray-200 pt-6 text-center text-sm text-gray-400">DECIDE © 2026. Make a choice you understand.</footer>
    </main>
  );
}

export default function StatsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#F8F9FC] flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>}>
      <StatsPageContent />
    </Suspense>
  );
}

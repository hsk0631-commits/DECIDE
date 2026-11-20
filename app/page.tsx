"use client";

import { useState } from "react";
import Link from "next/link";
import { DecisionProject, DecisionCategory, RequirementStatus, ScoreMap } from "@/types/decision";
import { loadProjects, saveProject, deleteProject } from "@/utils/storage";
import { DECISION_TEMPLATES } from "@/constants/templates";

export default function Home() {
  // Lazy initialization for expensive initial state
  const [showForm, setShowForm] = useState(false);
  const [inputMode, setInputMode] = useState<"direct" | "guided" | null>(null);
  const [title, setTitle] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<DecisionCategory>("custom");
  const [projects, setProjects] = useState<DecisionProject[]>(() => loadProjects());
  const [inProgressCount, setInProgressCount] = useState(() => 
    loadProjects().filter(p => p.status === "in_progress").length
  );
  const [completedCount, setCompletedCount] = useState(() => 
    loadProjects().filter(p => p.status === "completed").length
  );

  const closeForm = () => {
    setShowForm(false);
    setInputMode(null);
    setTitle("");
    setSelectedCategory("custom");
  };

  const createNewProject = () => {
    if (!title.trim()) {
      alert("고민 제목을 입력해주세요.");
      return;
    }

    const template = DECISION_TEMPLATES[selectedCategory];
    
    const newProject: DecisionProject = {
      id: crypto.randomUUID(),
      title: title.trim(),
      category: selectedCategory,
      status: "in_progress",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      options: template.defaultOptionsPlaceholder.map((opt) => ({
        id: crypto.randomUUID(),
        title: opt,
        description: "",
        pros: [],
        cons: []
      })),
      criteria: template.defaultCriteria.map(c => ({
        id: crypto.randomUUID(),
        title: c.title,
        weight: c.weight,
        description: c.description
      })),
      requirements: template.defaultRequirements.map(r => ({
        id: crypto.randomUUID(),
        title: r.title,
        status: "unknown" as RequirementStatus,
        description: r.description
      })),
      scores: {} as ScoreMap
    };

    saveProject(newProject);
    setProjects(prev => [newProject, ...prev]);
    setInProgressCount(prev => prev + 1);
    closeForm();
  };

  const handleDeleteProject = (id: string) => {
    if (!confirm("이 고민을 삭제하시겠어요? 삭제한 기록은 되돌릴 수 없습니다.")) return;

    const target = projects.find(p => p.id === id);
    deleteProject(id);
    setProjects(prev => prev.filter(p => p.id !== id));

    if (target?.status === "completed") {
      setCompletedCount(prev => Math.max(0, prev - 1));
    } else {
      setInProgressCount(prev => Math.max(0, prev - 1));
    }
  };

  const getCategoryName = (cat: DecisionCategory) => {
    return DECISION_TEMPLATES[cat]?.name || "직접 설정";
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("ko-KR", { month: "short", day: "numeric" });
  };

  return (
    <main className="min-h-screen bg-[#F8F9FC] text-[#202437]">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <div className="text-2xl font-black tracking-tight">
          DECIDE<span className="text-indigo-600">.</span>
        </div>
        <nav className="flex items-center gap-4">
          <Link href="/stats" className="text-sm text-gray-500 hover:text-indigo-600 font-medium">
            통계 보기
          </Link>
          <div className="text-sm text-gray-500">
            더 나은 결정을 위한 시작
          </div>
        </nav>
      </header>

      <section className="mx-auto max-w-6xl px-6 pb-20 pt-16">
        <div className="max-w-3xl">
          <div className="mb-6 inline-flex rounded-full bg-indigo-50 px-4 py-2 text-sm font-semibold text-indigo-600">
            YOUR DECISION, YOUR WAY
          </div>

          <h1 className="text-4xl font-bold leading-tight tracking-tight sm:text-6xl">
            고민은 줄이고,
            <br />
            <span className="text-indigo-600">확신은 높이세요.</span>
          </h1>

          <p className="mt-7 max-w-xl text-base leading-8 text-gray-500 sm:text-lg">
            선택하기 어려운 순간, DECIDE가 함께합니다.
            당신의 상황과 중요한 기준을 바탕으로
            더 납득할 수 있는 선택을 도와드립니다.
          </p>

          <button
            onClick={() => {
              setShowForm(!showForm);
              setInputMode(null);
            }}
            className="mt-9 rounded-xl bg-indigo-600 px-7 py-4 font-semibold text-white shadow-lg shadow-indigo-200 transition hover:bg-indigo-700"
          >
            + 새로운 고민 시작하기
          </button>
        </div>

        {showForm && (
          <div className="mt-10 max-w-xl rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            {!inputMode ? (
              <>
                <h2 className="text-xl font-bold">
                  고민을 어떻게 등록할까요?
                </h2>
                <p className="mt-2 text-sm text-gray-500">
                  편한 방법을 선택해주세요.
                </p>

                <div className="mt-6 grid gap-4">
                  <button
                    onClick={() => setInputMode("direct")}
                    className="rounded-xl border border-gray-200 p-5 text-left transition hover:border-indigo-500 hover:bg-indigo-50"
                  >
                    <div className="text-lg font-bold">
                      직접 입력하기
                    </div>
                    <p className="mt-2 text-sm text-gray-500">
                      고민 내용과 선택지를 직접 작성합니다.
                    </p>
                  </button>

                  <button
                    onClick={() => setInputMode("guided")}
                    className="rounded-xl border border-gray-200 p-5 text-left transition hover:border-indigo-500 hover:bg-indigo-50"
                  >
                    <div className="text-lg font-bold">
                      템플릿으로 시작하기
                    </div>
                    <p className="mt-2 text-sm text-gray-500">
                      상황별 추천 템플릿을 선택해 고민을 빠르게 정리합니다.
                    </p>
                  </button>
                </div>

                <button
                  onClick={closeForm}
                  className="mt-5 rounded-lg border border-gray-200 px-5 py-3 text-sm"
                >
                  취소
                </button>
              </>
            ) : inputMode === "direct" ? (
              <>
                <h2 className="text-xl font-bold">
                  어떤 고민이 있나요?
                </h2>
                <p className="mt-2 text-sm text-gray-500">
                  결정하고 싶은 내용을 간단하게 적어주세요.
                </p>

                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="예: 자동차를 바꿀까, 지금 차를 더 탈까?"
                  className="mt-5 w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-indigo-500"
                />

                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    고민 유형 (선택 사항)
                  </label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value as DecisionCategory)}
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-indigo-500"
                  >
                    {Object.entries(DECISION_TEMPLATES).map(([key, tmpl]) => (
                      <option key={key} value={key}>{tmpl.name}</option>
                    ))}
                  </select>
                </div>

                <div className="mt-4 flex gap-3">
                  <button
                    onClick={() => setInputMode(null)}
                    className="rounded-lg border border-gray-200 px-5 py-3 text-sm"
                  >
                    뒤로
                  </button>
                  <button
                    onClick={createNewProject}
                    className="rounded-lg bg-indigo-600 px-5 py-3 text-sm font-semibold text-white"
                  >
                    고민 생성하기
                  </button>
                </div>
              </>
            ) : (
              <>
                <h2 className="text-xl font-bold">
                  템플릿으로 시작하기
                </h2>
                <p className="mt-2 text-sm text-gray-500">
                  상황에 맞는 템플릿을 선택하면 기준과 선택지가 자동으로 구성됩니다.
                </p>

                <div className="mt-4 space-y-3 max-h-60 overflow-y-auto">
                  {Object.entries(DECISION_TEMPLATES).map(([key, tmpl]) => (
                    <button
                      key={key}
                      onClick={() => {
                        setSelectedCategory(key as DecisionCategory);
                        setInputMode("direct");
                        setTitle(tmpl.name + " 고민");
                      }}
                      className="w-full rounded-xl border border-gray-200 p-4 text-left transition hover:border-indigo-500 hover:bg-indigo-50"
                    >
                      <div className="font-bold text-gray-900">{tmpl.name}</div>
                      <p className="mt-1 text-sm text-gray-500">{tmpl.description}</p>
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => setInputMode(null)}
                  className="mt-5 rounded-lg border border-gray-200 px-5 py-3 text-sm"
                >
                  뒤로
                </button>
              </>
            )}
          </div>
        )}

        <div className="mt-24">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">나의 결정</h2>
            <span className="text-sm text-gray-400">MY DECISIONS</span>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-gray-100 bg-white p-6">
              <div className="text-sm text-gray-400">진행 중인 고민</div>
              <div className="mt-3 text-3xl font-bold text-indigo-600">{inProgressCount}</div>
              <div className="mt-2 text-sm text-gray-500">
                {inProgressCount > 0 
                  ? "진행 중인 결정을 계속해보세요." 
                  : "아직 진행 중인 결정이 없습니다."}
              </div>
            </div>

            <div className="rounded-2xl border border-gray-100 bg-white p-6">
              <div className="text-sm text-gray-400">완료한 결정</div>
              <div className="mt-3 text-3xl font-bold text-green-600">{completedCount}</div>
              <div className="mt-2 text-sm text-gray-500">
                {completedCount > 0
                  ? "당신의 결정 기록이 여기에 쌓입니다."
                  : "완료된 결정이 아직 없습니다."}
              </div>
            </div>

            <div className="rounded-2xl border border-gray-100 bg-white p-6">
              <div className="text-sm text-gray-400">결정 도우미</div>
              <div className="mt-3 text-xl font-bold">DECIDE</div>
              <div className="mt-2 text-sm text-gray-500">
                정답보다 납득할 수 있는 선택을.
              </div>
            </div>
          </div>
        </div>

        {/* 프로젝트 리스트 */}
        {(inProgressCount > 0 || completedCount > 0) && (
          <div className="mt-16">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">고민 목록</h2>
            </div>
            <div className="space-y-4">
              {projects.map(project => (
                <div
                  key={project.id}
                  className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm hover:shadow-md transition"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0 mr-4">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-gray-900 truncate">{project.title}</h3>
                        <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-indigo-50 text-indigo-600">
                          {getCategoryName(project.category)}
                        </span>
                        {project.status === "completed" && (
                          <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-green-50 text-green-600">
                            완료
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-sm text-gray-500">
                        {project.options.length}개 선택지 · {project.criteria.length}개 기준 · {formatDate(project.updatedAt)} 업데이트
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Link
                        href={"/detail/" + project.id}
                        className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                      >
                        이어서 하기
                      </Link>
                      <Link
                        href={"/share/" + project.id}
                        className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                      >
                        공유
                      </Link>
                      <button
                        onClick={() => handleDeleteProject(project.id)}
                        className="rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
                      >
                        삭제
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <footer className="mt-24 border-t border-gray-200 pt-6 text-center text-sm text-gray-400">
          DECIDE © 2026. Make a choice you understand.
        </footer>
      </section>
    </main>
  );
}

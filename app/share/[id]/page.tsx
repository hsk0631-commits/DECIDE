"use client";

import { useState, Suspense } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { DecisionProject } from "@/types/decision";
import { getProjectById } from "@/utils/storage";
import { DECISION_TEMPLATES } from "@/constants/templates";

function SharePageContent() {
  const params = useParams();

  const id = params.id as string;

  const [project] = useState<DecisionProject | null>(() => getProjectById(id));
  const [loading] = useState(false);
  const [notFound] = useState(() => !getProjectById(id));
  const [format, setFormat] = useState<"text" | "json" | "markdown">("text");
  const [copied, setCopied] = useState(false);

  const categoryName = DECISION_TEMPLATES[project?.category || "custom"]?.name || "직접 설정";

  const generateText = () => {
    if (!project) return "";
    let text = `DECIDE - ${project.title}\n`;
    text += `분야: ${categoryName}\n`;
    text += `상태: ${project.status === "completed" ? "완료" : "진행 중"}\n`;
    text += `생성일: ${new Date(project.createdAt).toLocaleDateString("ko-KR")}\n`;
    text += `업데이트: ${new Date(project.updatedAt).toLocaleDateString("ko-KR")}\n\n`;
    
    text += `선택지 (${project.options.length}개):\n`;
    project.options.forEach((opt, i) => {
      text += `  ${i + 1}. ${opt.title}\n`;
    });
    text += `\n`;
    
    text += `평가 기준 (${project.criteria.length}개):\n`;
    project.criteria.forEach((c, i) => {
      text += `  ${i + 1}. ${c.title} (중요도: ${c.weight}/5)\n`;
    });
    text += `\n`;
    
    if (project.review) {
      const chosen = project.options.find(o => o.id === project.review?.actualChoiceId);
      text += `--- 회고 ---\n`;
      text += `실제 선택: ${chosen?.title || "-"}\n`;
      text += `만족도: ${project.review?.satisfactionScore}/5\n`;
      text += `작성일: ${new Date(project.review?.reviewedAt || "").toLocaleDateString("ko-KR")}\n`;
      if (project.review?.reflectionText) {
        text += `회고: ${project.review.reflectionText}\n`;
      }
    }
    
    text += `\n---\nDECIDE로 만든 결정입니다.`;
    return text;
  };

  const generateMarkdown = () => {
    if (!project) return "";
    let md = `# ${project.title}\n\n`;
    md += `**분야:** ${categoryName}  \n`;
    md += `**상태:** ${project.status === "completed" ? "✅ 완료" : "🔄 진행 중"}  \n`;
    md += `**생성일:** ${new Date(project.createdAt).toLocaleDateString("ko-KR")}  \n`;
    md += `**업데이트:** ${new Date(project.updatedAt).toLocaleDateString("ko-KR")}\n\n`;
    
    md += `## 선택지 (${project.options.length}개)\n`;
    project.options.forEach((opt, i) => {
      md += `${i + 1}. ${opt.title}\n`;
    });
    md += `\n`;
    
    md += `## 평가 기준 (${project.criteria.length}개)\n`;
    project.criteria.forEach((c, i) => {
      md += `${i + 1}. **${c.title}** - 중요도: ${c.weight}/5\n`;
    });
    md += `\n`;
    
    if (project.review) {
      const chosen = project.options.find(o => o.id === project.review?.actualChoiceId);
      md += `--- \n## 📝 회고\n`;
      md += `- **실제 선택:** ${chosen?.title || "-"}\n`;
      md += `- **만족도:** ${project.review?.satisfactionScore}/5 ⭐\n`;
      md += `- **작성일:** ${new Date(project.review?.reviewedAt || "").toLocaleDateString("ko-KR")}\n`;
      if (project.review?.reflectionText) {
        md += `- **회고:** ${project.review.reflectionText}\n`;
      }
    }
    
    md += `\n---\n*DECIDE로 만든 결정입니다.*`;
    return md;
  };

  const generateJSON = () => {
    if (!project) return "";
    return JSON.stringify(project, null, 2);
  };

  const getOutput = () => {
    switch (format) {
      case "markdown": return generateMarkdown();
      case "json": return generateJSON();
      default: return generateText();
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(getOutput());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      alert("복사에 실패했습니다.");
    }
  };

  const handleDownload = () => {
    const blob = new Blob([getOutput()], { type: format === "json" ? "application/json" : "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${project?.title || "decision"}.${format === "json" ? "json" : format === "markdown" ? "md" : "txt"}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-[#F8F9FC] text-[#202437] flex items-center justify-center">
        <div className="text-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div><p className="mt-4 text-gray-500">불러오는 중...</p></div>
      </main>
    );
  }

  if (notFound || !project) {
    return (
      <main className="min-h-screen bg-[#F8F9FC] text-[#202437]">
        <div className="mx-auto max-w-2xl px-6 py-20 text-center">
          <Link href="/" className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-700 mb-8"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>홈으로 돌아가기</Link>
          <div className="rounded-2xl border border-gray-200 bg-white p-12"><div className="text-6xl mb-4">🔍</div><h1 className="text-2xl font-bold text-gray-900">고민을 찾을 수 없습니다</h1><p className="mt-2 text-gray-500">요청하신 고민이 삭제되었거나 존재하지 않습니다.</p><Link href="/" className="mt-6 inline-block rounded-lg bg-indigo-600 px-6 py-3 text-white font-medium hover:bg-indigo-700">홈으로 돌아가기</Link></div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F8F9FC] text-[#202437]">
      <header className="mx-auto flex max-w-4xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-4">
          <Link href="/" className="text-gray-500 hover:text-gray-700 p-2" aria-label="홈으로"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg></Link>
          <div><div className="text-2xl font-black tracking-tight">DECIDE<span className="text-indigo-600">.</span></div><div className="text-sm text-gray-500">{categoryName} · 공유</div></div>
        </div>
        <div className="flex items-center gap-3"><Link href="/stats" className="text-sm text-gray-500 hover:text-indigo-600 font-medium">통계 보기</Link></div>
      </header>

      <section className="mx-auto max-w-4xl px-6 pb-20">
        <div className="mb-8"><h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{project.title}</h1><div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-gray-500"><span>{project.options.length}개 선택지</span><span>·</span><span>{project.criteria.length}개 평가 기준</span>{project.review && <><span>·</span><span className="text-green-600 font-medium">회고 완료</span></>}</div></div>

        <div className="mb-8 rounded-2xl border border-gray-200 bg-white p-6">
          <h2 className="text-lg font-bold mb-4">공유 형식 선택</h2>
          <div className="flex gap-3 mb-6">
            <button onClick={() => setFormat("text")} className={"flex-1 px-4 py-3 rounded-xl border-2 font-medium transition " + (format === "text" ? "border-indigo-500 bg-indigo-50 text-indigo-700" : "border-gray-200 text-gray-600 hover:border-indigo-300")}>텍스트 (.txt)</button>
            <button onClick={() => setFormat("markdown")} className={"flex-1 px-4 py-3 rounded-xl border-2 font-medium transition " + (format === "markdown" ? "border-indigo-500 bg-indigo-50 text-indigo-700" : "border-gray-200 text-gray-600 hover:border-indigo-300")}>마크다운 (.md)</button>
            <button onClick={() => setFormat("json")} className={"flex-1 px-4 py-3 rounded-xl border-2 font-medium transition " + (format === "json" ? "border-indigo-500 bg-indigo-50 text-indigo-700" : "border-gray-200 text-gray-600 hover:border-indigo-300")}>JSON (.json)</button>
          </div>

          <div className="flex gap-3">
            <button onClick={handleCopy} className="flex-1 rounded-lg bg-indigo-600 px-6 py-3 font-semibold text-white hover:bg-indigo-700">{copied ? "✅ 복사됨!" : "📋 클립보드에 복사"}</button>
            <button onClick={handleDownload} className="flex-1 rounded-lg border border-gray-300 px-6 py-3 font-medium text-gray-700 hover:bg-gray-50">💾 파일로 다운로드</button>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-6">
          <h2 className="text-lg font-bold mb-4">미리보기</h2>
          <pre className="bg-gray-50 p-4 rounded-xl overflow-x-auto text-sm max-h-96">{getOutput()}</pre>
        </div>

        <footer className="mt-8 border-t border-gray-200 pt-6 text-center text-sm text-gray-400">DECIDE © 2026. Make a choice you understand.</footer>
      </section>
    </main>
  );
}

export default function SharePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#F8F9FC] flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>}>
      <SharePageContent />
    </Suspense>
  );
}

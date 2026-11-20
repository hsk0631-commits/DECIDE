import { DecisionProject } from '../types/decision';

const STORAGE_KEY = 'decide_projects_v1';

export function loadProjects(): DecisionProject[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      console.warn('Storage data is not an array. Resetting.');
      return [];
    }
    return parsed as DecisionProject[];
  } catch (error) {
    console.error('Failed to load decision projects from localStorage:', error);
    return [];
  }
}

export function saveProjects(projects: DecisionProject[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
  } catch (error) {
    console.error('Failed to save decision projects to localStorage:', error);
  }
}

export function getProjectById(id: string): DecisionProject | null {
  const projects = loadProjects();
  return projects.find((p) => p.id === id) || null;
}

export function saveProject(project: DecisionProject): void {
  const projects = loadProjects();
  const index = projects.findIndex((p) => p.id === project.id);
  const now = new Date().toISOString();
  
  if (index >= 0) {
    projects[index] = {
      ...project,
      updatedAt: now,
    };
  } else {
    projects.push({
      ...project,
      createdAt: project.createdAt || now,
      updatedAt: now,
    });
  }
  saveProjects(projects);
}

export function deleteProject(id: string): void {
  const projects = loadProjects();
  const filtered = projects.filter((p) => p.id !== id);
  saveProjects(filtered);
}

import { useState, useEffect } from 'react';

// Types for Career Insights stash
export interface ResumeInsight {
  summary: string;
  keySkills: string[];
  experience: string;
  timestamp: number;
}

export interface InterviewInsight {
  profileScore: number;
  strengths: string[];
  improvementAreas: string[];
  readinessLevel: string;
  timestamp: number;
}

export interface FootprintInsight {
  github?: {
    score: number;
    topLanguages: string[];
    totalRepos: number;
    totalStars: number;
  };
  linkedin?: {
    headline: string;
    connectionCount: number;
    topSkills: string[];
  };
  stackoverflow?: {
    reputation: number;
    badges: { gold: number; silver: number; bronze: number };
    topTags: string[];
  };
  timestamp: number;
}

export interface JobMarketInsight {
  lastRegion: string;
  lastCountry: string;
  resultsCount: number;
  averageSalary: string;
  remoteOpportunities: number;
  timestamp: number;
}

export interface CareerInsights {
  resumeSummary: ResumeInsight | null;
  interviewProfile: InterviewInsight | null;
  footprints: {
    github?: FootprintInsight['github'];
    linkedin?: FootprintInsight['linkedin'];
    stackoverflow?: FootprintInsight['stackoverflow'];
  };
  jobMarketSummary: JobMarketInsight | null;
}

const STORAGE_KEY = 'career_insights';

export const useCareerInsights = () => {
  const [insights, setInsights] = useState<CareerInsights>({
    resumeSummary: null,
    interviewProfile: null,
    footprints: {},
    jobMarketSummary: null,
  });

  // Load insights from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setInsights(JSON.parse(stored));
      } catch (error) {
        console.error('Error loading career insights:', error);
      }
    }
  }, []);

  // Save insights to localStorage whenever they change
  const saveInsights = (newInsights: CareerInsights) => {
    setInsights(newInsights);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newInsights));
  };

  const stashResumeInsight = (insight: ResumeInsight) => {
    saveInsights({
      ...insights,
      resumeSummary: insight,
    });
  };

  const stashInterviewInsight = (insight: InterviewInsight) => {
    saveInsights({
      ...insights,
      interviewProfile: insight,
    });
  };

  const stashFootprintInsight = (platform: 'github' | 'linkedin' | 'stackoverflow', data: any) => {
    saveInsights({
      ...insights,
      footprints: {
        ...insights.footprints,
        [platform]: data,
      },
    });
  };

  const stashJobMarketInsight = (insight: JobMarketInsight) => {
    saveInsights({
      ...insights,
      jobMarketSummary: insight,
    });
  };

  const clearInsights = () => {
    const emptyInsights: CareerInsights = {
      resumeSummary: null,
      interviewProfile: null,
      footprints: {},
      jobMarketSummary: null,
    };
    saveInsights(emptyInsights);
  };

  const hasInsights = () => {
    return !!(
      insights.resumeSummary ||
      insights.interviewProfile ||
      Object.keys(insights.footprints).length > 0 ||
      insights.jobMarketSummary
    );
  };

  const getInsightCount = () => {
    let count = 0;
    if (insights.resumeSummary) count++;
    if (insights.interviewProfile) count++;
    count += Object.keys(insights.footprints).length;
    if (insights.jobMarketSummary) count++;
    return count;
  };

  return {
    insights,
    stashResumeInsight,
    stashInterviewInsight,
    stashFootprintInsight,
    stashJobMarketInsight,
    clearInsights,
    hasInsights: hasInsights(),
    insightCount: getInsightCount(),
  };
};
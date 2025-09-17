import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { toast } from '@/hooks/use-toast';
import { useGenerateQuestions, useAnalyzeResponse, useGenerateProfile } from '@/hooks/useApiHooks';
import { useCareerInsights } from '@/hooks/useCareerInsights';
import { LoadingCard } from '@/components/LoadingSpinner';
import { MessageSquare, Sparkles, Lightbulb, Target, Mic } from 'lucide-react';

type QA = { question: string; response: string; analysis?: any; type?: string };

const INTERVIEW_TYPES = ['technical', 'behavioral', 'mixed'];

const Interview: React.FC = () => {
  const [jobDescription, setJobDescription] = useState<string>('Senior React developer for fintech dashboard; focus on performance, accessibility, testing.');
  const [interviewType, setInterviewType] = useState<string>('mixed');
  const [numQuestions, setNumQuestions] = useState<number>(6);
  const [qaList, setQaList] = useState<QA[]>([]);
  const [currentIdx, setCurrentIdx] = useState<number>(0);
  const [profileSummary, setProfileSummary] = useState<any>(null);

  const { stashInterviewInsight } = useCareerInsights();

  const { mutate: generateQuestions, isPending: isGenerating } = useGenerateQuestions();
  const { mutate: analyzeResponse, isPending: isAnalyzing } = useAnalyzeResponse();
  const { mutate: generateProfile, isPending: isProfiling } = useGenerateProfile();

  const answeredCount = useMemo(() => qaList.filter(q => q.response && q.response.trim().length > 0).length, [qaList]);

  const onGenerate = () => {
    if (!jobDescription.trim()) {
      toast({ title: 'Add a job description', description: 'Describe the role to tailor questions.', variant: 'destructive' });
      return;
    }
    generateQuestions(
      { job_description: jobDescription, interview_type: interviewType, num_questions: numQuestions },
      {
        onSuccess: (res: any) => {
          const qs = res?.questions || [];
          const next = qs.map((q: any) => ({ question: q.question || q, response: '', type: q.type } as QA));
          setQaList(next);
          setCurrentIdx(0);
          setProfileSummary(null);
          toast({ title: 'Questions ready', description: `Generated ${next.length} questions.` });
        },
        onError: () => toast({ title: 'Failed to generate', description: 'Try again in a moment.', variant: 'destructive' }),
      }
    );
  };

  const onAnalyze = (index: number) => {
    const item = qaList[index];
    if (!item.response.trim()) {
      toast({ title: 'Write an answer first', description: 'Provide your response to analyze.', variant: 'destructive' });
      return;
    }
    // Prevent duplicate analysis spamming
    if (item.analysis && item.analysis.__finalized) {
      toast({ title: 'Already analyzed', description: 'You can edit the answer to re-analyze.', variant: 'default' });
    }
    analyzeResponse(
      { question: item.question, response: item.response, question_type: item.type || 'mixed' },
      {
        onSuccess: (res: any) => {
          const normalize = (a: any) => {
            const analysis = a?.analysis ?? a ?? {};
            return {
              overall_score: analysis.overall_score ?? analysis.score ?? analysis.rating ?? 0,
              keywords_used: analysis.keywords_used ?? analysis.keywords ?? analysis.highlights ?? [],
              improvement_suggestions: analysis.improvement_suggestions ?? analysis.suggestions ?? analysis.advice ?? [],
              strengths: analysis.strengths ?? analysis.highlights ?? [],
              __finalized: true,
            };
          };
          const copy = [...qaList];
          copy[index] = { ...copy[index], analysis: normalize(res) };
          setQaList(copy);
          // Auto-advance to next question if available
          if (index < copy.length - 1) {
            setTimeout(() => setCurrentIdx(index + 1), 400);
          }
          toast({ title: 'Analysis ready', description: 'Feedback generated for your answer.' });
        },
        onError: () => toast({ title: 'Analysis failed', description: 'Please try again.', variant: 'destructive' }),
      }
    );
  };

  const onGenerateProfile = () => {
    if (!qaList.length) {
      toast({ title: 'Generate questions first', description: 'You need questions and answers to build a profile.', variant: 'destructive' });
      return;
    }
    const anyUnanswered = qaList.some(q => !q.response || !q.response.trim());
    if (anyUnanswered) {
      toast({ title: 'Answer all questions', description: 'Please respond to all questions before submitting.', variant: 'destructive' });
      return;
    }
    const responses = qaList.map(q => ({ question: q.question, response: q.response, analysis: q.analysis }));
    generateProfile(
      { responses },
      {
        onSuccess: (res: any) => {
          const p = res?.profile || res || {};
          setProfileSummary(p);
          // Stash lightweight insight for dashboard/report
          const profileScore = p.overall_performance || p.overall_score || p.score || 80;
          const strengths = p.strengths || p.highlights || ['Communication', 'Problem Solving'];
          const improvementAreas = p.improvement_areas || p.suggestions || ['System Design'];
          const readinessLevel = p.interview_readiness || p.readiness || 'Good';
          stashInterviewInsight({ profileScore, strengths, improvementAreas, readinessLevel, timestamp: Date.now() });
          toast({ title: 'Profile created', description: 'Interview readiness profile generated.' });
        },
        onError: () => toast({ title: 'Profile failed', description: 'Please try again later.', variant: 'destructive' }),
      }
    );
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex justify-center mb-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent-light text-accent ring-1 ring-border">
            <MessageSquare className="h-7 w-7" />
          </div>
        </div>
        <h1 className="text-3xl font-bold mb-2">AI Interview Coach</h1>
        <p className="text-xl text-muted-foreground">Generate tailored questions, practice answers, get feedback, and build your profile</p>
      </div>

      {/* Step 1: Configure & Generate Questions */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Sparkles className="h-5 w-5" /> Configure Session</CardTitle>
          <CardDescription>Describe the role and choose your interview style</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 space-y-2">
              <Label htmlFor="jd">Target Role Description</Label>
              <Textarea id="jd" value={jobDescription} onChange={(e) => setJobDescription(e.target.value)} className="min-h-[110px]" placeholder="Paste or describe the job description..." />
            </div>
            <div className="space-y-3">
              <div className="space-y-2">
                <Label>Interview Type</Label>
                <Select value={interviewType} onValueChange={setInterviewType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>Types</SelectLabel>
                      {INTERVIEW_TYPES.map(t => (<SelectItem key={t} value={t}>{t}</SelectItem>))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="num">Number of Questions</Label>
                <Input id="num" type="number" min={3} max={12} value={numQuestions} onChange={(e) => setNumQuestions(Number(e.target.value))} />
              </div>
              <Button onClick={onGenerate} disabled={isGenerating} variant="accent" className="w-full">
                {isGenerating ? 'Generating…' : 'Generate Questions'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Step 2: Answer & Analyze */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Practice & Feedback</CardTitle>
          <CardDescription>Write your responses and get instant analysis</CardDescription>
        </CardHeader>
        <CardContent>
          {!qaList.length ? (
            <div className="text-center py-12 text-muted-foreground">Generate questions to start practicing.</div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">Question {currentIdx + 1} / {qaList.length}</div>
                <div className="w-40"><Progress value={((currentIdx + 1) / qaList.length) * 100} className="h-2" /></div>
              </div>

              {(() => {
                const qa = qaList[currentIdx];
                const idx = currentIdx;
                return (
                  <div className="p-4 border rounded-lg bg-card-hover">
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1 w-full">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold">Q{idx + 1}. {qa.question}</h3>
                          {qa.type && <Badge variant="secondary">{qa.type}</Badge>}
                        </div>
                        <Textarea value={qa.response} onChange={(e) => {
                          const copy = [...qaList];
                          copy[idx] = { ...copy[idx], response: e.target.value };
                          setQaList(copy);
                        }} placeholder="Write your answer here..." />
                      </div>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <Button onClick={() => onAnalyze(idx)} disabled={isAnalyzing} variant="outline">{isAnalyzing ? 'Analyzing…' : (idx < qaList.length - 1 ? 'Analyze & Next' : (qaList[idx].analysis ? 'Re-analyze' : 'Analyze'))}</Button>
                        {idx === qaList.length - 1 && (
                          <Button onClick={onGenerateProfile} disabled={isProfiling || !qaList.length} variant="hero">
                            {isProfiling ? 'Submitting…' : 'Submit All & Generate Profile'}
                          </Button>
                        )}
                      </div>
                    </div>
                    {qa.analysis && (
                      <div className="mt-3 grid md:grid-cols-3 gap-4">
                        <div>
                          <div className="text-xs text-muted-foreground mb-1">Overall</div>
                          <div className="flex items-center gap-2">
                            <Progress value={(qa.analysis.overall_score || 0) * 10} className="h-2" />
                            <span className="text-sm font-medium">{qa.analysis.overall_score || 0}/10</span>
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground mb-1">Highlights</div>
                          <div className="text-sm text-muted-foreground">{(qa.analysis.keywords_used || []).slice(0, 5).join(', ') || '—'}</div>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground mb-1">Suggestions</div>
                          <ul className="text-sm list-disc list-inside text-muted-foreground space-y-0.5">
                            {(qa.analysis.improvement_suggestions || []).slice(0, 3).map((s: string, i: number) => <li key={i}>{s}</li>)}
                          </ul>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}

              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">Answered {answeredCount} / {qaList.length}</div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" disabled={currentIdx === 0} onClick={() => setCurrentIdx(Math.max(0, currentIdx - 1))}>Prev</Button>
                  <Button variant="outline" disabled={currentIdx >= qaList.length - 1} onClick={() => setCurrentIdx(Math.min(qaList.length - 1, currentIdx + 1))}>Next</Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Step 3: Profile Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Target className="h-5 w-5" /> Interview Profile</CardTitle>
          <CardDescription>Your strengths, gaps, and readiness level</CardDescription>
        </CardHeader>
        <CardContent>
          {isProfiling ? (
            <LoadingCard message="Building your interview profile..." />
          ) : profileSummary ? (
            <div className="grid md:grid-cols-3 gap-6">
              <div className="space-y-3">
                <div className="text-xs text-muted-foreground">Overall Performance</div>
                <div className="flex items-center gap-2">
                  <Progress value={((profileSummary.overall_performance || profileSummary.overall_score || 0) * 10)} className="h-2" />
                  <span className="text-sm font-medium">{profileSummary.overall_performance || profileSummary.overall_score || 0}/10</span>
                </div>
                <Separator />
                <div className="text-xs text-muted-foreground">Readiness</div>
                <div className="inline-flex items-center gap-2 p-2 rounded-md bg-success-light text-success text-sm">
                  <Lightbulb className="h-4 w-4" /> {profileSummary.interview_readiness || 'Good'}
                </div>
              </div>
              <div>
                <div className="text-sm font-semibold mb-2">Top Strengths</div>
                <ul className="text-sm list-disc list-inside text-muted-foreground space-y-1">
                  {(profileSummary.strengths || []).map((s: string, i: number) => <li key={i}>{s}</li>)}
                </ul>
              </div>
              <div>
                <div className="text-sm font-semibold mb-2">Improvement Areas</div>
                <ul className="text-sm list-disc list-inside text-muted-foreground space-y-1">
                  {(profileSummary.improvement_areas || []).map((s: string, i: number) => <li key={i}>{s}</li>)}
                </ul>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">Generate your profile after answering and analyzing questions.</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Interview;
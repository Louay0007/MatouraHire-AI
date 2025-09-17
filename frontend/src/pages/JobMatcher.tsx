import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/hooks/use-toast';
import { useSearchJobs, useAnalyzeCv, useResumeWriter } from '@/hooks/useApiHooks';
// mock mode removed
import { LoadingCard } from '@/components/LoadingSpinner';
import { Building2, Globe2, MapPin, Search, Sparkles, Star, Wifi, CalendarDays, Upload, X, Briefcase } from 'lucide-react';

const REGIONS: Record<string, string[]> = {
  'North Africa': ['Algeria', 'Egypt', 'Libya', 'Morocco', 'Sudan', 'Tunisia'],
  'Sub-Saharan Africa': ['Nigeria', 'Kenya', 'Ghana', 'Ethiopia', 'South Africa', 'Rwanda', 'Uganda', 'Tanzania'],
  'MENA': ['United Arab Emirates', 'Saudi Arabia', 'Qatar', 'Bahrain', 'Oman', 'Kuwait', 'Jordan', 'Lebanon', 'Tunisia', 'Morocco', 'Algeria', 'Egypt'],
  'North America': ['United States', 'Canada', 'Mexico'],
  'Europe': ['United Kingdom', 'France', 'Germany', 'Spain', 'Italy', 'Netherlands', 'Sweden', 'Norway', 'Denmark', 'Finland', 'Ireland', 'Portugal', 'Poland'],
  'Asia': ['India', 'China', 'Japan', 'South Korea', 'Singapore', 'Malaysia', 'Indonesia', 'Vietnam', 'Philippines', 'Thailand']
};

// currency removed from UI and request

const prettyDate = (val?: any) => {
  if (!val) return 'Not provided';
  const s = String(val).trim();
  if (!s || s.toLowerCase() === 'n/a' || s.toLowerCase() === 'unknown') return 'Not provided';
  // If looks like relative text (e.g., "5 days ago"), show as-is
  if (/\b(ago|day|week|month|year)s?\b/i.test(s)) return s;
  // Try parse as date
  const d = new Date(s);
  if (!Number.isNaN(d.getTime())) return d.toLocaleDateString();
  return s;
};


const JobMatcher: React.FC = () => {
  // Removed manual text paste; we will analyze from uploaded PDF automatically
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [suggestedRoles, setSuggestedRoles] = useState<string[]>([]);
  const [extractedSkills, setExtractedSkills] = useState<string[]>([]);
  const [newRole, setNewRole] = useState<string>('');
  const [region, setRegion] = useState<string>('');
  const [country, setCountry] = useState<string>('');
  const [maxJobs, setMaxJobs] = useState<number>(30);
  const [remoteOk, setRemoteOk] = useState<boolean>(false);
  // currency removed

  const countriesForRegion = useMemo(() => (region ? REGIONS[region] || [] : []), [region]);

  const { mutate: searchJobs, data, isPending } = useSearchJobs();
  const { mutate: analyzeCv, isPending: isAnalyzing } = useAnalyzeCv();
  const { mutate: resumeRewrite, isPending: isRewriting } = useResumeWriter();

  const onAnalyzeCv = () => {
    if (!selectedFile) {
      toast({ title: 'Upload your CV', description: 'Please select a PDF to analyze.', variant: 'destructive' });
      return;
    }
    // Use resume writer to extract/normalize text, then feed into analyze_cv
    resumeRewrite(selectedFile, {
      onSuccess: (rw: any) => {
        const text = rw?.rewritten_resume || '';
        if (!text) {
          toast({ title: 'Extraction failed', description: 'Could not read text from the PDF.', variant: 'destructive' });
          return;
        }
        analyzeCv(
          { resume_text: text },
          {
            onSuccess: (res: any) => {
              const rolesFromCategories = res?.analysis?.job_categories || [];
              const rolesFromSuggestions = res?.analysis?.suggested_roles || [];
              const jobKeywordsRaw = res?.analysis?.job_keywords || '';
              const rolesFromKeywords = jobKeywordsRaw ? String(jobKeywordsRaw).split(/\s+OR\s+/i).map((s: string) => s.trim()).filter(Boolean) : [];
              const roles = (rolesFromSuggestions.length ? rolesFromSuggestions : rolesFromKeywords.length ? rolesFromKeywords : rolesFromCategories).slice(0, 10);
              const skills = res?.analysis?.skills || [];
              setSuggestedRoles(roles);
              setExtractedSkills(skills);
              toast({ title: 'Resume analyzed', description: 'Roles and skills extracted.' });
            },
            onError: () => {
              toast({ title: 'Analysis failed', description: 'Please try again.', variant: 'destructive' });
            },
          }
        );
      },
      onError: () => {
        toast({ title: 'Upload failed', description: 'Could not process the PDF. Try another file.', variant: 'destructive' });
      },
    });
  };

  const handleSearch = () => {
    const primary = (suggestedRoles[0] || '').replace(/&/g, 'and').trim();
    const kw = primary.replace(/[^\p{L}\p{N} ]+/gu, ' ').replace(/\s+/g, ' ').trim();
    if (!kw) {
      toast({ title: 'Missing roles', description: 'Analyze your resume to generate keywords.', variant: 'destructive' });
      return;
    }
    if (!country) {
      toast({ title: 'Select a country', description: 'Choose a specific country to search in.', variant: 'destructive' });
      return;
    }
    const params: any = {
      keywords: String(kw),
      location: String(country),
      max_jobs: String(maxJobs),
      remote_ok: remoteOk ? 'true' : 'false',
    };
    // Per proven working call, omit region from request
    // currency removed from request
    searchJobs(params);
  };

  const results = data;

  const scope = useMemo(() => {
    const keywordsScore = suggestedRoles.length ? Math.min(50, suggestedRoles.length * 10) : 0;
    const locationScore = country ? 35 : 0;
    const remoteScore = remoteOk ? 10 : 5;
    const volumeScore = Math.min(5, Math.max(0, Math.round((maxJobs - 10) / 20))); // 0..5
    const total = Math.max(0, Math.min(100, keywordsScore + locationScore + remoteScore + volumeScore));
    return { keywordsScore, locationScore, remoteScore, volumeScore, total };
  }, [suggestedRoles, country, remoteOk, maxJobs]);

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex justify-center mb-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-success-light text-success ring-1 ring-border">
            <Briefcase className="h-7 w-7" />
          </div>
        </div>
        <h1 className="text-3xl font-bold mb-2">Smart Job Matcher</h1>
        <p className="text-xl text-muted-foreground">Find regionally relevant roles with AI-powered insights</p>
      </div>

      {/* Step 1: Analyze CV to extract roles & skills (PDF only) */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Analyze Your CV
          </CardTitle>
          <CardDescription>Upload your CV (PDF). We’ll extract text and identify roles and skills automatically.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="space-y-3">
              <Label htmlFor="resume-upload">Upload CV (PDF)</Label>
              <Input
                id="resume-upload"
                type="file"
                accept=".pdf"
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
              />
              {selectedFile && (
                <div className="p-3 border rounded-lg bg-card-hover text-sm">{selectedFile.name}</div>
              )}
              <Button onClick={onAnalyzeCv} disabled={!selectedFile || isAnalyzing || isRewriting} className="w-full" variant="accent">
                {isAnalyzing || isRewriting ? 'Processing…' : (!selectedFile ? 'Upload a PDF to Analyze' : 'Analyze CV')}
              </Button>
              <div className="text-xs text-muted-foreground">We convert your PDF to text securely and never store your file.</div>
            </div>
            {(suggestedRoles.length > 0 || extractedSkills.length > 0) && (
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label>Suggested Roles</Label>
                    {suggestedRoles.length > 0 && (
                      <Button size="sm" variant="outline" onClick={() => setSuggestedRoles([])}>Clear</Button>
                    )}
                  </div>
                  <div className="flex gap-2 mb-2">
                    <Input
                      placeholder="Add a role (e.g., Data Scientist)"
                      value={newRole}
                      onChange={(e) => setNewRole(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          const v = newRole.trim();
                          if (v && !suggestedRoles.includes(v)) {
                            setSuggestedRoles([v, ...suggestedRoles]);
                            setNewRole('');
                          }
                        }
                      }}
                    />
                    <Button
                      variant="secondary"
                      onClick={() => {
                        const v = newRole.trim();
                        if (v && !suggestedRoles.includes(v)) {
                          setSuggestedRoles([v, ...suggestedRoles]);
                          setNewRole('');
                        }
                      }}
                    >Add</Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {suggestedRoles.length ? suggestedRoles.map((role, i) => (
                      <span key={`${role}-${i}`} className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-primary-light text-primary text-sm">
                        {role}
                        <button aria-label="remove" onClick={() => setSuggestedRoles(suggestedRoles.filter((r, idx) => idx !== i))} className="ml-1 text-primary hover:opacity-80">
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </span>
                    )) : (
                      <div className="text-sm text-muted-foreground">No roles yet — upload your CV and analyze.</div>
                    )}
                  </div>
                </div>
                <div>
                  <Label>Extracted Skills</Label>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {extractedSkills.length ? extractedSkills.map((skill, i) => (
                      <Badge key={`${skill}-${i}`} variant="secondary">{skill}</Badge>
                    )) : (
                      <div className="text-sm text-muted-foreground">No skills extracted yet.</div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          
        </CardContent>
      </Card>

      {/* Step 2: Search Controls */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Job Search Filters
          </CardTitle>
          <CardDescription>Refine your search by region, country, and preferences</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Keywords (from CV)</Label>
              <div className="p-2 border rounded-md bg-card-hover min-h-[44px] flex flex-wrap gap-2">
                {suggestedRoles.length ? (
                  suggestedRoles.map((role, i) => (
                    <Badge key={`${role}-${i}`} variant="secondary">{role}</Badge>
                  ))
                ) : (
                  <span className="text-sm text-muted-foreground">Analyze your CV to generate keywords</span>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Region</Label>
              <Select value={region} onValueChange={(v) => { setRegion(v); setCountry(''); }}>
                <SelectTrigger>
                  <SelectValue placeholder="Select region" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Regions</SelectLabel>
                    {Object.keys(REGIONS).map((r) => (
                      <SelectItem key={r} value={r}>{r}</SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Country</Label>
              <Select value={country} onValueChange={setCountry} disabled={!region}>
                <SelectTrigger>
                  <SelectValue placeholder={region ? 'Select a country' : 'Select region first'} />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>{region || 'Countries'}</SelectLabel>
                    {countriesForRegion.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Max Jobs</Label>
              <Input
                type="number"
                min={1}
                max={100}
                value={maxJobs}
                onChange={(e) => setMaxJobs(Math.max(1, Math.min(100, Number(e.target.value))))}
              />
              <div className="text-xs text-muted-foreground">Choose between 1 and 100 results.</div>
            </div>
            <div className="flex items-end gap-3">
              <div className="flex items-center gap-2">
                <input id="remote" type="checkbox" checked={remoteOk} onChange={(e) => setRemoteOk(e.target.checked)} className="h-4 w-4" />
                <Label htmlFor="remote">Prefer Remote</Label>
              </div>
              <div className="ml-auto hidden lg:block" />
            </div>
            {/* currency selector removed */}
      </div>

          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            <Button onClick={handleSearch} disabled={isPending || !suggestedRoles.length || !country} className="flex-1" variant="hero">
              <Search className="mr-2 h-4 w-4" />
              Search Jobs
            </Button>
            
          </div>
        </CardContent>
      </Card>

      {/* Results & Insights */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
      <Card>
        <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Results</span>
                {results && (
                  <Badge variant="secondary">{results.total_found} found</Badge>
                )}
              </CardTitle>
              <CardDescription>
                {results ? (
                  <span>
                    {results.keywords} • <span className="inline-flex items-center"><MapPin className="h-3.5 w-3.5 mr-1" />{results.location}</span> {results.region ? `• ${results.region}` : ''}
                  </span>
                ) : (
                  'Run a search to see matching opportunities'
                )}
              </CardDescription>
        </CardHeader>
        <CardContent>
              {isPending ? (
                <LoadingCard message="Finding the best matches for you..." />
              ) : results && results.jobs?.length ? (
                <div className="space-y-4">
                  {results.jobs.map((job, idx) => (
                    <div key={idx} className="p-4 border rounded-lg bg-card-hover hover:shadow-md transition-smooth">
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h3 className="text-lg font-semibold">{job.title}</h3>
                            {job.region_match && <Badge variant="secondary">Region Match</Badge>}
                            {job.remote_flag && (
                              <Badge variant="secondary" className="inline-flex items-center gap-1">
                                <Wifi className="h-3.5 w-3.5" /> Remote OK
                              </Badge>
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground inline-flex items-center gap-3 flex-wrap">
                            <span className="inline-flex items-center gap-1"><Building2 className="h-3.5 w-3.5" />{job.company}</span>
                            <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{job.location}</span>
                            <span className="inline-flex items-center gap-1"><CalendarDays className="h-3.5 w-3.5" />Posted: {prettyDate(job.posted_date)}</span>
                          </div>
                        </div>
                        <a href={job.job_link} target="_blank" rel="noreferrer">
                          <Button size="sm" variant="outline">View Job →</Button>
                        </a>
                      </div>

                      <div className="grid md:grid-cols-1 gap-4 mt-4">
                        <div className="space-y-1">
                          <div className="text-xs text-muted-foreground">Highlights</div>
                          <div className="flex flex-wrap gap-2">
                            <Badge variant="outline" className="inline-flex items-center gap-1"><Star className="h-3.5 w-3.5 text-warning" /> Featured</Badge>
                            {job.remote_flag && <Badge variant="secondary">Remote</Badge>}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">No results yet. Try adjusting your filters and search again.</div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Insights */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe2 className="h-5 w-5" />
                Regional Insights
              </CardTitle>
              <CardDescription>Context for your selected region and country</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Selected Region</span>
                <Badge variant="secondary">{region || '—'}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Country</span>
                <Badge variant="secondary">{country || '—'}</Badge>
              </div>
              <Separator />
              <div className="space-y-2">
                <div className="text-xs text-muted-foreground">Tips</div>
                <ul className="text-sm list-disc list-inside text-muted-foreground space-y-1">
                  <li>Use role variants (e.g., "React Developer" OR "Frontend Engineer").</li>
                  <li>Try a nearby country if results are low.</li>
                  <li>Prefer “Remote” for broader reach if available.</li>
                </ul>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Search Health</CardTitle>
              <CardDescription>How well your filters are scoped</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="text-xs text-muted-foreground mb-2">Scope Balance</div>
                <Progress value={scope.total} className="h-2" />
                <div className="mt-1 text-xs text-muted-foreground">{scope.total}/100</div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="p-2 rounded-md bg-primary-light text-primary text-center text-sm">Keywords {scope.keywordsScore}</div>
                <div className="p-2 rounded-md bg-accent-light text-accent text-center text-sm">Location {scope.locationScore}</div>
                <div className="p-2 rounded-md bg-success-light text-success text-center text-sm">Remote {scope.remoteScore}</div>
              </div>
        </CardContent>
      </Card>
        </div>
      </div>
    </div>
  );
};

export default JobMatcher;
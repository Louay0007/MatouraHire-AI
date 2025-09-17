import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { LoadingCard } from '@/components/LoadingSpinner';
import { useAnalyzeGithub, useAnalyzeLinkedin, useAnalyzeStackOverflow } from '@/hooks/useApiHooks';
import { useCareerInsights } from '@/hooks/useCareerInsights';
import { Activity, Github, Linkedin, Layers } from 'lucide-react';

const Footprint: React.FC = () => {
  const [ghUser, setGhUser] = useState('');
  const [liUser, setLiUser] = useState('');
  const [liUrl, setLiUrl] = useState('');
  const [soUserId, setSoUserId] = useState('');

  const { stashFootprintInsight } = useCareerInsights();

  const { mutate: analyzeGithub, data: ghData, isPending: ghLoading } = useAnalyzeGithub();
  const { mutate: analyzeLinkedin, data: liData, isPending: liLoading } = useAnalyzeLinkedin();
  const { mutate: analyzeStackOverflow, data: soData, isPending: soLoading } = useAnalyzeStackOverflow();

  const onAnalyzeGithub = () => {
    if (!ghUser.trim()) return;
    analyzeGithub({ username: ghUser });
  };

  const onAnalyzeLinkedin = () => {
    if (!liUser.trim() && !liUrl.trim()) return;
    analyzeLinkedin({ username: liUser || undefined, profile_url: liUrl || undefined });
  };

  const onAnalyzeStackOverflow = () => {
    if (!soUserId.trim()) return;
    analyzeStackOverflow({ user_id: soUserId });
  };

  const gh = ghData?.github_profile;
  const li = liData?.linkedin_profile;
  const so = soData?.stackoverflow_profile;

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl space-y-8">
      {/* Header */}
      <div className="text-center">
        <div className="flex justify-center mb-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-warning-light text-warning ring-1 ring-border">
            <Activity className="h-7 w-7" />
          </div>
        </div>
        <h1 className="text-3xl font-bold mb-2">Digital Footprint</h1>
        <p className="text-xl text-muted-foreground">Analyze your presence on GitHub, LinkedIn, and StackOverflow</p>
      </div>

      {/* GitHub */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Github className="h-5 w-5" /> GitHub</CardTitle>
          <CardDescription>Enter a username to retrieve public profile and contributions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="space-y-2 md:col-span-1">
              <Label htmlFor="gh">Username</Label>
              <Input id="gh" placeholder="e.g., octocat" value={ghUser} onChange={(e) => setGhUser(e.target.value)} />
              <Button className="w-full" onClick={onAnalyzeGithub} disabled={ghLoading} variant="accent">{ghLoading ? 'Analyzing…' : 'Analyze GitHub'}</Button>
            </div>
            <div className="md:col-span-2">
              {ghLoading ? (
                <LoadingCard message="Fetching GitHub profile..." />
              ) : gh ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    {gh.avatar_url && (<img src={gh.avatar_url} alt={gh.username} className="h-16 w-16 rounded-full border" />)}
                    <div>
                      <div className="text-xl font-semibold">{gh.name || gh.username}</div>
                      <div className="text-sm text-muted-foreground">{gh.bio || '—'}</div>
                      <div className="mt-2 flex flex-wrap gap-2 text-sm text-muted-foreground">
                        <Badge variant="secondary">Repos {gh.public_repos}</Badge>
                        <Badge variant="secondary">Stars {gh.total_stars}</Badge>
                        <Badge variant="secondary">Followers {gh.followers}</Badge>
                      </div>
                    </div>
                  </div>
                  <Separator />
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm font-semibold mb-2">Top Repositories</div>
                      <div className="space-y-2">
                        {gh.top_repos?.slice(0, 5).map((r: any, i: number) => (
                          <a key={i} href={r.html_url} target="_blank" rel="noreferrer" className="block p-3 border rounded-lg hover:shadow-sm">
                            <div className="flex items-center justify-between">
                              <div className="font-medium">{r.name}</div>
                              <div className="text-sm text-muted-foreground">⭐ {r.stars}</div>
                            </div>
                            {r.language && <div className="text-xs text-muted-foreground mt-1">{r.language}</div>}
                            {r.description && <div className="text-sm text-muted-foreground mt-1 line-clamp-2">{r.description}</div>}
                          </a>
                        ))}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm font-semibold mb-2">Languages</div>
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(gh.languages || {}).sort((a:any,b:any)=> (b[1] as number) - (a[1] as number)).slice(0,8).map(([lang]) => (
                          <Badge key={lang} variant="outline">{lang}</Badge>
                        ))}
                      </div>
                      <div className="text-sm font-semibold mt-4 mb-2">Recent Activity</div>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        {(gh.recent_activity || []).slice(0,5).map((ev: any, i: number) => (
                          <li key={i}>{ev.type} • {ev.repo} • {new Date(ev.created_at).toLocaleDateString()}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">Enter a username and click Analyze.</div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* LinkedIn */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Linkedin className="h-5 w-5" /> LinkedIn</CardTitle>
          <CardDescription>Provide username or full profile URL</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="space-y-2 md:col-span-1">
              <Label htmlFor="liuser">Username</Label>
              <Input id="liuser" placeholder="e.g., johndoe" value={liUser} onChange={(e) => setLiUser(e.target.value)} />
              <Label htmlFor="liurl" className="mt-2">Profile URL</Label>
              <Input id="liurl" placeholder="https://www.linkedin.com/in/username" value={liUrl} onChange={(e) => setLiUrl(e.target.value)} />
              <Button className="w-full" onClick={onAnalyzeLinkedin} disabled={liLoading} variant="accent">{liLoading ? 'Analyzing…' : 'Analyze LinkedIn'}</Button>
            </div>
            <div className="md:col-span-2">
              {liLoading ? (
                <LoadingCard message="Fetching LinkedIn profile..." />
              ) : li ? (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl" style={{ background: 'linear-gradient(135deg, #0077b5 0%, #005885 100%)' }}>
                    <div className="flex items-center gap-4">
                      {li.profile_picture && (
                        <img src={li.profile_picture} alt={li.full_name || 'LinkedIn profile'} className="h-16 w-16 rounded-full border border-white/30 object-cover bg-white/10" />
                      )}
                      <div className="text-white">
                        <div className="text-2xl font-semibold">{li.full_name || '—'}</div>
                        <div className="opacity-90">{li.headline || '—'}</div>
                        <div className="mt-2 flex gap-4 opacity-90 text-sm">
                          <span>Followers {li.follower_count || 0}</span>
                          {li.city && <span>{li.city}{li.country ? `, ${li.country}` : ''}</span>}
                        </div>
                      </div>
                    </div>
                  </div>
                  {li.about && (
                    <div>
                      <div className="text-sm font-semibold mb-2">About</div>
                      <div className="text-sm text-muted-foreground">{li.about}</div>
                    </div>
                  )}
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm font-semibold mb-2">Experience</div>
                      <div className="space-y-2">
                        {(li.experience || []).slice(0,5).map((e:any,i:number)=>(
                          <div key={i} className="p-3 border rounded-lg">
                            <div className="font-medium">{e.title || '—'}</div>
                            <div className="text-sm text-muted-foreground">{e.company || '—'} {e.duration ? `• ${e.duration}` : ''}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm font-semibold mb-2">Skills & Certifications</div>
                      <div className="flex flex-wrap gap-2 mb-3">
                        {(li.skills_list || []).slice(0,12).map((s:string,i:number)=>(<Badge key={i} variant="secondary">{s}</Badge>))}
                      </div>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        {(li.certifications || []).slice(0,5).map((c:any,i:number)=>{
                          const title = c?.title || c?.name || (typeof c === 'string' ? c : '');
                          const issuer = c?.issuer || c?.organization || '';
                          const issued = c?.issuedDate || c?.issued_date || '';
                          const line = [title, issuer && `— ${issuer}`, issued && `(${issued})`].filter(Boolean).join(' ');
                          return (<li key={i}>• {line || '—'}</li>);
                        })}
                      </ul>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">Enter a username or URL and click Analyze.</div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* StackOverflow */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Layers className="h-5 w-5" /> StackOverflow</CardTitle>
          <CardDescription>Enter StackOverflow user ID</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="space-y-2 md:col-span-1">
              <Label htmlFor="so">User ID</Label>
              <Input id="so" placeholder="e.g., 22656" value={soUserId} onChange={(e) => setSoUserId(e.target.value)} />
              <Button className="w-full" onClick={onAnalyzeStackOverflow} disabled={soLoading} variant="accent">{soLoading ? 'Analyzing…' : 'Analyze StackOverflow'}</Button>
            </div>
            <div className="md:col-span-2">
              {soLoading ? (
                <LoadingCard message="Fetching StackOverflow profile..." />
              ) : so ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    {so.profile_image && (<img src={so.profile_image} alt={so.display_name} className="h-16 w-16 rounded-full border" />)}
                    <div>
                      <div className="text-xl font-semibold">{so.display_name}</div>
                      <div className="text-sm text-muted-foreground">Reputation {so.reputation}</div>
                      <div className="mt-2 flex gap-2 text-sm text-muted-foreground flex-wrap">
                        <Badge variant="secondary">Gold {so.badge_counts?.gold || 0}</Badge>
                        <Badge variant="secondary">Silver {so.badge_counts?.silver || 0}</Badge>
                        <Badge variant="secondary">Bronze {so.badge_counts?.bronze || 0}</Badge>
                      </div>
                    </div>
                  </div>
                  <Separator />
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm font-semibold mb-2">Top Tags</div>
                      <div className="flex flex-wrap gap-2">
                        {(so.top_tags || []).slice(0,8).map((t:any,i:number)=>(<Badge key={i} variant="outline">{t.tag_name} • {t.answer_score}</Badge>))}
                      </div>
                      <div className="text-sm font-semibold mt-4 mb-2">Recent Questions</div>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        {(so.recent_questions || []).map((q:any,i:number)=>(<li key={i}>• {q.title}</li>))}
                      </ul>
                    </div>
                    <div>
                      <div className="text-sm font-semibold mb-2">Activity</div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm"><span>Answers</span><span>{so.answers}</span></div>
                        <div className="flex items-center justify-between text-sm"><span>Questions</span><span>{so.questions}</span></div>
                        <div className="flex items-center justify-between text-sm"><span>Accepted Rate</span><span>{so.accepted_answer_rate ?? '—'}{typeof so.accepted_answer_rate === 'number' ? '%' : ''}</span></div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">Enter a user ID and click Analyze.</div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Footprint;
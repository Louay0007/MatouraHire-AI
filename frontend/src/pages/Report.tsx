import React, { useRef, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { LoadingCard } from '@/components/LoadingSpinner';
import { useCreateReport, useAggregateReport } from '@/hooks/useApiHooks';
import { useCareerInsights } from '@/hooks/useCareerInsights';
import { ChartBar, Upload, FileText, Download, Lightbulb } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const Report: React.FC = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [pdfReport, setPdfReport] = useState<string>('');
  const [aggregateReport, setAggregateReport] = useState<string>('');

  const { insights } = useCareerInsights();
  const { mutate: createReport, isPending: isCreating } = useCreateReport();
  const { mutate: aggregate, isPending: isAggregating } = useAggregateReport();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.type !== 'application/pdf') {
      toast({ title: 'Invalid file type', description: 'Please upload a PDF file.', variant: 'destructive' });
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast({ title: 'File too large', description: 'Max size is 10MB.', variant: 'destructive' });
      return;
    }
    setSelectedFile(file);
    setPdfReport('');
  };

  const onGenerateFromPdf = () => {
    if (!selectedFile) {
      toast({ title: 'No file selected', description: 'Choose a PDF to upload.', variant: 'destructive' });
      return;
    }
    createReport(selectedFile, {
      onSuccess: (res: any) => {
        setPdfReport(res?.report || '');
        toast({ title: 'Report generated', description: 'Your PDF-based report is ready.' });
      },
      onError: () => toast({ title: 'Failed to generate', description: 'Try again later.', variant: 'destructive' }),
    });
  };

  const buildAggregatePayload = () => {
    return {
      resume: insights.resumeSummary || null,
      interview: insights.interviewProfile || null,
      footprint: insights.footprints || {},
      job_market: insights.jobMarketSummary || null,
      meta: { generated_at: new Date().toISOString() },
    };
  };

  const onGenerateAggregate = () => {
    const payload = buildAggregatePayload();
    aggregate(payload, {
      onSuccess: (res: any) => {
        setAggregateReport(res?.report || '');
        toast({ title: 'Comprehensive report ready', description: 'Aggregated from your saved insights.' });
      },
      onError: () => toast({ title: 'Failed to aggregate', description: 'Add insights first or try again.', variant: 'destructive' }),
    });
  };

  const downloadText = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const currentUserSlug = () => {
    try {
      const raw = localStorage.getItem('auth_user');
      if (!raw) return 'user';
      const u = JSON.parse(raw);
      const name = u?.name || u?.full_name || u?.username || (u?.email ? String(u.email).split('@')[0] : 'user');
      return String(name)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '') || 'user';
    } catch {
      return 'user';
    }
  };

  const renderPrettyReport = (text: string) => {
    const lines = String(text || '').split(/\r?\n/);
    const headingRegex = /^(Executive Summary|Summary|Top Strengths|Strengths|Improvement Areas|Gaps|Next Steps|Recommendations|Career Insights|Profile|Overview)\s*:?/i;
    const renderInline = (s: string) => {
      const parts = s.split(/\*\*(.*?)\*\*/g);
      const out: any[] = [];
      for (let i = 0; i < parts.length; i++) {
        if (i % 2 === 1) out.push(<strong key={i}>{parts[i]}</strong>);
        else if (parts[i]) out.push(<span key={i}>{parts[i]}</span>);
      }
      return out.length ? out : s;
    };
    return (
      <div className="p-4 rounded-lg border bg-card-hover text-sm leading-6 space-y-2">
        {lines.map((line, i) => {
          const trimmed = line.trim();
          if (!trimmed) {
            return <div key={i} className="h-2" />;
          }
          if (headingRegex.test(trimmed)) {
            const title = trimmed.replace(/:\s*$/, '');
            return (
              <div key={i} className="mt-3 pt-2 border-l-4 pl-3 bg-primary-light/30 border-primary text-primary font-bold rounded">
                <strong>**{title}**</strong>
              </div>
            );
          }
          // bullet normalization
          const content = trimmed.replace(/^[-•]\s*/, '• ');
          return <div key={i} className="text-muted-foreground">{renderInline(content)}</div>;
        })}
      </div>
    );
  };

  const insightBadges = (
    <div className="flex flex-wrap gap-2">
      <Badge variant={insights.resumeSummary ? 'secondary' : 'outline'}>Resume</Badge>
      <Badge variant={insights.interviewProfile ? 'secondary' : 'outline'}>Interview</Badge>
      <Badge variant={Object.keys(insights.footprints).length ? 'secondary' : 'outline'}>Footprint</Badge>
      <Badge variant={insights.jobMarketSummary ? 'secondary' : 'outline'}>Job Market</Badge>
    </div>
  );

  return (
    <div className="container mx-auto py-8 px-4 max-w-6xl space-y-8">
      {/* Header */}
      <div className="text-center">
        <div className="flex justify-center mb-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-danger-light text-danger ring-1 ring-border">
            <ChartBar className="h-7 w-7" />
          </div>
        </div>
        <h1 className="text-3xl font-bold mb-2">Career Insights Report</h1>
        <p className="text-xl text-muted-foreground">Generate a polished report from your resume, interview, footprint, and job market insights</p>
      </div>

      {/* Generate from PDF */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Upload className="h-5 w-5" /> Generate from PDF</CardTitle>
          <CardDescription>Upload a resume PDF to generate a narrative report</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="pdf">Resume PDF</Label>
              <Input id="pdf" type="file" accept=".pdf" onChange={handleFileSelect} ref={fileInputRef} />
              {selectedFile && (
                <div className="p-3 border rounded-lg bg-card-hover text-sm flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  {selectedFile.name}
                </div>
              )}
              <Button onClick={onGenerateFromPdf} disabled={!selectedFile || isCreating} variant="accent" className="w-full">{isCreating ? 'Generating…' : 'Generate Report'}</Button>
            </div>
            <div className="lg:col-span-2">
              {isCreating ? (
                <LoadingCard message="Generating report from PDF..." />
              ) : pdfReport ? (
                <div className="space-y-4">
                  {renderPrettyReport(pdfReport)}
                  <div className="flex gap-3">
                    <Button variant="outline" onClick={() => downloadText(pdfReport, `${currentUserSlug()}-career-report.txt`)}>
                      <Download className="mr-2 h-4 w-4" /> Download
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">Upload a PDF and click Generate to view the report here.</div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      
    </div>
  );
};

export default Report;
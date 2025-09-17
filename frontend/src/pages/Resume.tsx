import React, { useState, useRef } from 'react';
import { useResumeWriter, useResumePdfFromText, useResumePdfUpload } from '@/hooks/useApiHooks';
import { useCareerInsights } from '@/hooks/useCareerInsights';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { LoadingCard } from '@/components/LoadingSpinner';
import { 
  Upload, 
  FileText, 
  Download, 
  Sparkles, 
  CheckCircle2,
  AlertCircle,
  Save
} from 'lucide-react';

const Resume: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [rewrittenResume, setRewrittenResume] = useState<string>('');
  const [templateId, setTemplateId] = useState<string>('ats');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { mutate: rewriteResume, isPending } = useResumeWriter();
  const { mutate: generatePdfFromText, isPending: isPdfFromTextPending } = useResumePdfFromText();
  const { mutate: generatePdfFromUpload, isPending: isPdfFromUploadPending } = useResumePdfUpload();
  const { stashResumeInsight } = useCareerInsights();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        toast({
          title: "Invalid file type",
          description: "Please select a PDF file.",
          variant: "destructive",
        });
        return;
      }
      
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        toast({
          title: "File too large",
          description: "Please select a file smaller than 10MB.",
          variant: "destructive",
        });
        return;
      }
      
      setSelectedFile(file);
      setRewrittenResume(''); // Clear previous results
    }
  };

  const handleUpload = () => {
    if (!selectedFile) {
      toast({
        title: "No file selected",
        description: "Please select a PDF file to upload.",
        variant: "destructive",
      });
      return;
    }

    rewriteResume(selectedFile, {
      onSuccess: (data) => {
        setRewrittenResume(data.rewritten_resume);
        toast({
          title: "Resume rewritten successfully!",
          description: "Your optimized resume is ready for download.",
        });
      },
      onError: (error: any) => {
        console.error('Resume rewrite error:', error);
        toast({
          title: "Failed to rewrite resume",
          description: "Please try again or contact support if the issue persists.",
          variant: "destructive",
        });
      },
    });
  };

  const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDownloadPDF = () => {
    if (rewrittenResume) {
      generatePdfFromText({ rewritten_resume: rewrittenResume, templateId }, {
        onSuccess: (blob) => {
          downloadBlob(blob, 'enhanced_resume.pdf');
          toast({ title: 'Resume PDF ready', description: 'Downloaded enhanced resume.' });
        },
        onError: (error: any) => {
          console.error('PDF from text error:', error);
          toast({ title: 'Failed to generate PDF', description: 'Please try again.', variant: 'destructive' });
        }
      });
    } else if (selectedFile) {
      generatePdfFromUpload({ file: selectedFile, templateId }, {
        onSuccess: (blob) => {
          downloadBlob(blob, 'enhanced_resume.pdf');
          toast({ title: 'Resume PDF ready', description: 'Downloaded enhanced resume.' });
        },
        onError: (error: any) => {
          console.error('PDF from upload error:', error);
          toast({ title: 'Failed to generate PDF', description: 'Please try again.', variant: 'destructive' });
        }
      });
    } else {
      toast({ title: 'No content', description: 'Rewrite or select a file first.', variant: 'destructive' });
    }
  };

  const handleAddToInsights = () => {
    if (!rewrittenResume) return;

    // Extract key information for insights
    const lines = rewrittenResume.split('\n');
    const skillsSection = lines.find(line => line.toLowerCase().includes('skills') || line.toLowerCase().includes('technical'));
    const skills = skillsSection ? 
      skillsSection.split(':')[1]?.split(',').map(s => s.trim()).filter(Boolean) || [] : 
      ['React', 'TypeScript', 'Node.js', 'Python']; // Fallback skills

    const insight = {
      summary: rewrittenResume.substring(0, 200) + '...',
      keySkills: skills.slice(0, 8), // Limit to 8 skills
      experience: "5+ years", // This would be extracted from the actual resume
      timestamp: Date.now(),
    };

    stashResumeInsight(insight);
    
    toast({
      title: "Added to Career Insights",
      description: "Resume analysis has been saved to your career profile.",
    });
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex justify-center mb-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-light text-primary">
            <FileText className="h-6 w-6" />
          </div>
        </div>
        <h1 className="text-3xl font-bold mb-2">AI Resume Rewriter</h1>
        <p className="text-xl text-muted-foreground">
          Transform your resume with AI-powered optimization and industry insights
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Upload Section */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Upload Your Resume
              </CardTitle>
              <CardDescription>
                Upload your current resume in PDF format for AI-powered optimization
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="resume-upload">Select PDF File</Label>
                <Input
                  id="resume-upload"
                  type="file"
                  accept=".pdf"
                  onChange={handleFileSelect}
                  ref={fileInputRef}
                  disabled={isPending}
                />
              </div>

              {selectedFile && (
                <div className="p-3 border rounded-lg bg-card-hover">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">{selectedFile.name}</span>
                    <Badge variant="secondary" className="ml-auto">
                      {(selectedFile.size / 1024 / 1024).toFixed(1)} MB
                    </Badge>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="template">Template</Label>
                <select
                  id="template"
                  className="w-full h-10 rounded-md border bg-background px-3 text-sm"
                  value={templateId}
                  onChange={(e) => setTemplateId(e.target.value)}
                  disabled={isPending || isPdfFromTextPending || isPdfFromUploadPending}
                >
                  <option value="ats">ATS (Clean)</option>
                  <option value="modern">Modern (Indigo)</option>
                  <option value="classic">Classic (Serif)</option>
                  <option value="compact">Compact (2-Column)</option>
                </select>
              </div>

              <Button
                onClick={handleUpload}
                disabled={!selectedFile || isPending}
                className="w-full"
                variant="hero"
              >
                {isPending ? (
                  <>
                    <Sparkles className="mr-2 h-4 w-4 animate-spin" />
                    Rewriting Resume...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Rewrite with AI
                  </>
                )}
              </Button>

              <div className="text-xs text-muted-foreground space-y-1">
                <div className="flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3 text-success" />
                  <span>PDF files only</span>
                </div>
                <div className="flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3 text-success" />
                  <span>Maximum file size: 10MB</span>
                </div>
                <div className="flex items-center gap-1">
                  <AlertCircle className="h-3 w-3 text-warning" />
                  <span>Processing typically takes 30-60 seconds</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Results Section */}
        <div className="space-y-6">
          <Card className="min-h-[400px]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                Rewritten Resume
              </CardTitle>
              <CardDescription>
                Your AI-optimized resume with enhanced formatting and content
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isPending ? (
                <LoadingCard message="AI is rewriting your resume..." />
              ) : rewrittenResume ? (
                <div className="space-y-4">
                  <div className="max-h-96 overflow-y-auto p-4 border rounded-lg bg-card-hover">
                    <pre className="whitespace-pre-wrap text-sm font-mono">
                      {rewrittenResume}
                    </pre>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button onClick={handleDownloadPDF} variant="outline" className="flex-1" disabled={isPdfFromTextPending || isPdfFromUploadPending}>
                      <Download className="mr-2 h-4 w-4" />
                      {isPdfFromTextPending || isPdfFromUploadPending ? 'Generating PDF...' : 'Download PDF'}
                    </Button>
                    <Button
                      onClick={handleAddToInsights}
                      variant="accent"
                      className="flex-1"
                    >
                      <Save className="mr-2 h-4 w-4" />
                      Add to Insights
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    Upload your resume to see the AI-rewritten version here
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Features Info */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>What Our AI Does</CardTitle>
          <CardDescription>
            Advanced resume optimization powered by machine learning
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center space-y-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-light text-primary mx-auto">
                <Sparkles className="h-5 w-5" />
              </div>
              <h3 className="font-semibold">Content Enhancement</h3>
              <p className="text-sm text-muted-foreground">
                Improves language, adds industry keywords, and optimizes for ATS systems
              </p>
            </div>
            <div className="text-center space-y-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent-light text-accent mx-auto">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <h3 className="font-semibold">Structure Optimization</h3>
              <p className="text-sm text-muted-foreground">
                Reorganizes content for maximum impact and readability
              </p>
            </div>
            <div className="text-center space-y-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success-light text-success mx-auto">
                <FileText className="h-5 w-5" />
              </div>
              <h3 className="font-semibold">Professional Formatting</h3>
              <p className="text-sm text-muted-foreground">
                Ensures consistent, professional appearance across all sections
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Resume;
import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useCareerInsights } from '@/hooks/useCareerInsights';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MetricsCard } from '@/components/MetricsCard';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  MessageSquare, 
  Search, 
  Activity, 
  ChartBar,
  ArrowRight,
  Clock,
  TrendingUp,
  Target,
  Lightbulb
} from 'lucide-react';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const { insights, insightCount, hasInsights } = useCareerInsights();

  const quickActions = [
    {
      title: "Rewrite Resume",
      description: "Upload and optimize your resume with AI",
      icon: FileText,
      href: "/resume",
      color: "text-primary",
      bgColor: "bg-primary-light",
    },
    {
      title: "Interview Practice",
      description: "Practice with AI-generated questions",
      icon: MessageSquare,
      href: "/interview",
      color: "text-accent",
      bgColor: "bg-accent-light",
    },
    {
      title: "Find Jobs",
      description: "Discover matching opportunities",
      icon: Search,
      href: "/job-matcher",
      color: "text-success",
      bgColor: "bg-success-light",
    },
    {
      title: "Generate Report",
      description: "Create comprehensive career report",
      icon: ChartBar,
      href: "/report",
      color: "text-warning",
      bgColor: "bg-warning-light",
    },
  ];

  const getInsightSummary = () => {
    const summaries = [];
    
    if (insights.resumeSummary) {
      summaries.push({
        type: "Resume",
        date: new Date(insights.resumeSummary.timestamp).toLocaleDateString(),
        skills: insights.resumeSummary.keySkills.length,
      });
    }
    
    if (insights.interviewProfile) {
      summaries.push({
        type: "Interview",
        date: new Date(insights.interviewProfile.timestamp).toLocaleDateString(),
        score: insights.interviewProfile.profileScore,
      });
    }
    
    if (insights.jobMarketSummary) {
      summaries.push({
        type: "Job Market",
        date: new Date(insights.jobMarketSummary.timestamp).toLocaleDateString(),
        results: insights.jobMarketSummary.resultsCount,
      });
    }

    const footprintCount = Object.keys(insights.footprints).length;
    if (footprintCount > 0) {
      summaries.push({
        type: "Footprint",
        date: "Recent",
        platforms: footprintCount,
      });
    }
    
    return summaries;
  };

  return (
    <div className="container mx-auto py-8 px-4 space-y-8">
      {/* Welcome Header */}
      <div className="text-center space-y-4">
        <h1 className="text-3xl md:text-4xl font-bold">
          Welcome back, {user?.name}!
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Your AI-powered career command center. Track your progress and take your next step.
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricsCard
          title="Career Insights"
          value={insightCount}
          subtitle={`${hasInsights ? 'Ready for report' : 'Start collecting'}`}
          icon={Lightbulb}
          variant={hasInsights ? "success" : "default"}
        />
        <MetricsCard
          title="Profile Score"
          value={insights.interviewProfile?.profileScore || "N/A"}
          subtitle="Interview readiness"
          icon={Target}
          variant={insights.interviewProfile ? "success" : "default"}
        />
        <MetricsCard
          title="Skills Identified"
          value={insights.resumeSummary?.keySkills.length || 0}
          subtitle="From resume analysis" 
          icon={TrendingUp}
          variant={insights.resumeSummary ? "success" : "default"}
        />
        <MetricsCard
          title="Job Matches"
          value={insights.jobMarketSummary?.resultsCount || 0}
          subtitle="Last search results"
          icon={Search}
          variant={insights.jobMarketSummary ? "success" : "default"}
        />
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-2xl font-bold mb-6">Quick Actions</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action, index) => (
            <Card key={index} className="group hover:shadow-lg transition-smooth hover:scale-[1.02] transform">
              <CardHeader className="pb-3">
                <div className={`inline-flex h-10 w-10 items-center justify-center rounded-lg ${action.bgColor} mb-3`}>
                  <action.icon className={`h-5 w-5 ${action.color}`} />
                </div>
                <CardTitle className="text-lg">{action.title}</CardTitle>
                <CardDescription className="text-sm">
                  {action.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <Link to={action.href}>
                  <Button variant="outline" size="sm" className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-smooth">
                    Start Now
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Career Insights Summary */}
      {hasInsights ? (
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Your Career Insights</h2>
            <Link to="/report">
              <Button variant="accent">
                Generate Full Report
                <ChartBar className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            {getInsightSummary().map((insight, index) => (
              <Card key={index} className="hover:shadow-md transition-smooth">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{insight.type} Analysis</CardTitle>
                    <Badge variant="secondary">
                      <Clock className="h-3 w-3 mr-1" />
                      {insight.date}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {'skills' in insight && (
                      <p className="text-sm text-muted-foreground">
                        <span className="font-medium text-foreground">{insight.skills}</span> skills identified
                      </p>
                    )}
                    {'score' in insight && (
                      <p className="text-sm text-muted-foreground">
                        Profile score: <span className="font-medium text-foreground">{insight.score}/100</span>
                      </p>
                    )}
                    {'results' in insight && (
                      <p className="text-sm text-muted-foreground">
                        <span className="font-medium text-foreground">{insight.results}</span> job matches found
                      </p>
                    )}
                    {'platforms' in insight && (
                      <p className="text-sm text-muted-foreground">
                        <span className="font-medium text-foreground">{insight.platforms}</span> platforms analyzed
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ) : (
        <Card className="text-center py-12">
          <CardContent>
            <Lightbulb className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <CardTitle className="text-xl mb-2">Start Building Your Career Profile</CardTitle>
            <CardDescription className="text-base mb-6 max-w-md mx-auto">
              Use our AI tools to analyze your resume, practice interviews, and discover job opportunities. 
              Your insights will appear here as you use the platform.
            </CardDescription>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link to="/resume">
                <Button variant="hero">
                  Upload Resume
                  <FileText className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link to="/footprint">
                <Button variant="outline">
                  Analyze Footprint
                  <Activity className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Dashboard;
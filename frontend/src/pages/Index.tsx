import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useCareerInsights } from "@/hooks/useCareerInsights";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MetricsCard } from "@/components/MetricsCard";
import { 
  Brain, 
  FileText, 
  MessageSquare, 
  Search, 
  Activity, 
  ChartBar,
  ArrowRight,
  Sparkles,
  Target,
  Users
} from "lucide-react";

const Index = () => {
  const { isAuthenticated, user } = useAuth();
  const { insightCount, hasInsights } = useCareerInsights();

  const features = [
    {
      icon: FileText,
      title: "AI Resume Rewriter",
      description: "Transform your resume with AI-powered optimization and industry-specific enhancements.",
      href: "/resume",
      color: "text-primary",
      bgColor: "bg-primary-light",
    },
    {
      icon: MessageSquare,
      title: "AI Interview Coach",
      description: "Practice with AI-generated questions and get detailed performance analysis.",
      href: "/interview",
      color: "text-accent",
      bgColor: "bg-accent-light",
    },
    {
      icon: Search,
      title: "Smart Job Matcher",
      description: "Find perfect job matches based on your skills and preferences with market insights.",
      href: "/job-matcher",
      color: "text-success",
      bgColor: "bg-success-light",
    },
    {
      icon: Activity,
      title: "Digital Footprint",
      description: "Analyze your GitHub, LinkedIn, and StackOverflow profiles for career growth.",
      href: "/footprint",
      color: "text-warning",
      bgColor: "bg-warning-light",
    },
    {
      icon: ChartBar,
      title: "Career Reports",
      description: "Generate comprehensive career development reports with actionable insights.",
      href: "/report",
      color: "text-danger",
      bgColor: "bg-danger-light",
    },
  ];

  const stats = [
    { label: "AI Models", value: "5+", icon: Brain },
    { label: "Career Insights", value: "15K+", icon: Target },
    { label: "Success Stories", value: "2.5K+", icon: Sparkles },
    { label: "Active Users", value: "10K+", icon: Users },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative py-20 px-4 text-center bg-gradient-hero">
        <div className="container mx-auto max-w-4xl">
          <div className="flex justify-center mb-6">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-primary text-primary-foreground shadow-glow">
              <Brain className="h-8 w-8" />
            </div>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-primary bg-clip-text text-transparent">
            MatouraHire AI
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            Transform your career with AI-driven insights. From resume optimization to interview coaching, we help you land your dream job.
          </p>
          
          {isAuthenticated ? (
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link to="/dashboard">
                <Button variant="hero" size="xl" className="w-full sm:w-auto">
                  Go to Dashboard
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              {hasInsights && (
                <div className="text-sm text-muted-foreground">
                  {insightCount} career insights ready
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/auth/register">
                <Button variant="hero" size="xl" className="w-full sm:w-auto">
                  Get Started Free
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link to="/auth/login">
                <Button variant="outline" size="xl" className="w-full sm:w-auto">
                  Sign In
                </Button>
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-4 bg-card">
        <div className="container mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {stats.map((stat, index) => (
              <MetricsCard
                key={index}
                title={stat.label}
                value={stat.value}
                icon={stat.icon}
                variant="default"
              />
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Everything You Need for Career Success
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Our comprehensive suite of AI tools helps you at every step of your career journey.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <Card key={index} className="group hover:shadow-lg transition-smooth hover:scale-[1.02] transform">
                <CardHeader>
                  <div className={`inline-flex h-12 w-12 items-center justify-center rounded-lg ${feature.bgColor} mb-4`}>
                    <feature.icon className={`h-6 w-6 ${feature.color}`} />
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                  <CardDescription className="text-base">
                    {feature.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isAuthenticated ? (
                    <Link to={feature.href}>
                      <Button variant="outline" className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-smooth">
                        Get Started
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                  ) : (
                    <Link to="/auth/register">
                      <Button variant="outline" className="w-full">
                        Sign Up to Access
                      </Button>
                    </Link>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      {!isAuthenticated && (
        <section className="py-20 px-4 bg-gradient-primary text-primary-foreground">
          <div className="container mx-auto max-w-4xl text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Ready to Transform Your Career?
            </h2>
            <p className="text-xl mb-8 opacity-90">
              Join thousands of professionals who have accelerated their careers with our AI platform.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/auth/register">
                <Button variant="secondary" size="xl" className="w-full sm:w-auto">
                  Start Your Journey
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

export default Index;

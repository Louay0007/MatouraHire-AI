import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LucideIcon } from 'lucide-react';

interface MetricsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: LucideIcon;
  trend?: 'up' | 'down' | 'neutral';
  badges?: string[];
  variant?: 'default' | 'success' | 'warning' | 'danger';
}

export const MetricsCard: React.FC<MetricsCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  badges,
  variant = 'default',
}) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'success':
        return 'border-success/20 bg-success-light/50';
      case 'warning':
        return 'border-warning/20 bg-warning-light/50';
      case 'danger':
        return 'border-danger/20 bg-danger-light/50';
      default:
        return 'border-border bg-card-hover';
    }
  };

  const getTrendColor = () => {
    switch (trend) {
      case 'up':
        return 'text-success';
      case 'down':
        return 'text-danger';
      default:
        return 'text-muted-foreground';
    }
  };

  return (
    <Card className={`${getVariantStyles()} hover:shadow-md transition-smooth`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-foreground">{value}</div>
        {subtitle && (
          <p className={`text-xs ${getTrendColor()}`}>
            {subtitle}
          </p>
        )}
        {badges && badges.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {badges.map((badge, index) => (
              <Badge key={index} variant="secondary" className="text-xs">
                {badge}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
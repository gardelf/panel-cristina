import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink, RefreshCw } from "lucide-react";
import { ReactNode } from "react";

interface WidgetProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  children: ReactNode;
  externalLink?: string;
  externalLinkText?: string;
  onRefresh?: () => void;
  isLoading?: boolean;
  className?: string;
}

export function Widget({
  title,
  description,
  icon,
  children,
  externalLink,
  externalLinkText = "Abrir",
  onRefresh,
  isLoading = false,
  className = "",
}: WidgetProps) {
  return (
    <Card className={`widget-card ${className}`}>
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-4">
        <div className="space-y-1 flex-1">
          <div className="flex items-center gap-2">
            {icon && <div className="text-primary">{icon}</div>}
            <CardTitle className="text-xl">{title}</CardTitle>
          </div>
          {description && (
            <CardDescription className="text-sm">{description}</CardDescription>
          )}
        </div>
        <div className="flex items-center gap-2">
          {onRefresh && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onRefresh}
              disabled={isLoading}
              className="h-8 w-8"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            </Button>
          )}
          {externalLink && (
            <Button
              variant="outline"
              size="sm"
              asChild
              className="h-8"
            >
              <a href={externalLink} target="_blank" rel="noopener noreferrer">
                {externalLinkText}
                <ExternalLink className="ml-1 h-3 w-3" />
              </a>
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

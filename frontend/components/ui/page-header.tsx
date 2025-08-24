import { GradientText } from "@/components/ui/gradient-text"
import { Separator } from "@/components/ui/separator"

interface PageHeaderProps {
  title: string;
  description?: string;
  children?: React.ReactNode;
}

export function PageHeader({ title, description, children }: PageHeaderProps) {
  return (
    <div className="">
      <div className="flex items-center justify-between">
        <div>
          <GradientText>{title}</GradientText>
          {description && <p className="mt-2 text-muted-foreground">{description}</p>}
        </div>
        {children && <div>{children}</div>}
      </div>
      <div className="pt-2">
        <Separator className="w-full" />
      </div>
    </div>
  );
}

import React from "react";
import { cn } from "@/lib/utils";

const variantStyles = {
  default: {
    bg: "bg-card",
    iconBg: "bg-primary/10",
    iconColor: "text-primary",
    valueBorder: "",
  },
  warning: {
    bg: "bg-card border-l-4 border-l-yellow-500",
    iconBg: "bg-yellow-50",
    iconColor: "text-yellow-600",
    valueBorder: "text-yellow-600",
  },
  critical: {
    bg: "bg-card border-l-4 border-l-red-600",
    iconBg: "bg-red-50",
    iconColor: "text-red-600",
    valueBorder: "text-red-600",
  },
};

export default function DashboardCard({ title, value, icon: Icon, variant = "default", onClick }) {
  const styles = variantStyles[variant];

  return (
    <div
      onClick={onClick}
      className={cn(
        "rounded-xl border border-border shadow-sm p-5 cursor-pointer hover:shadow-md transition-shadow",
        styles.bg
      )}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground font-medium">{title}</p>
          <p className={cn("text-3xl font-bold mt-2", styles.valueBorder || "text-foreground")}>
            {value}
          </p>
        </div>
        <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", styles.iconBg)}>
          <Icon className={cn("w-5 h-5", styles.iconColor)} />
        </div>
      </div>
    </div>
  );
}
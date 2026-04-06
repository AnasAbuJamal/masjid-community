import * as React from "react";
import { cn } from "@/lib/utils";

const Badge = React.forwardRef<
    HTMLSpanElement,
    React.HTMLAttributes<HTMLSpanElement> & {
        variant?: "default" | "secondary" | "destructive" | "outline" | "success" | "warning";
    }
>(({ className, variant = "default", ...props }, ref) => {
    const variants = {
        default: "bg-emerald-100 text-emerald-800",
        secondary: "bg-gray-100 text-gray-800",
        destructive: "bg-red-100 text-red-800",
        outline: "border border-gray-200 text-gray-700",
        success: "bg-green-100 text-green-800",
        warning: "bg-yellow-100 text-yellow-800",
    };

    return (
        <span
            ref={ref}
            className={cn(
                "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors",
                variants[variant],
                className
            )}
            {...props}
        />
    );
});
Badge.displayName = "Badge";

export { Badge };

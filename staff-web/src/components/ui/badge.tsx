import * as React from "react";
import { cn } from "@/lib/utils";

const Badge = React.forwardRef<
    HTMLSpanElement,
    React.HTMLAttributes<HTMLSpanElement> & {
        variant?: "default" | "secondary" | "destructive" | "outline" | "success" | "warning";
    }
>(({ className, variant = "default", ...props }, ref) => {
    const variants = {
        default: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
        secondary: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300",
        destructive: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
        outline: "border border-gray-200 text-gray-700 dark:border-gray-600 dark:text-gray-300",
        success: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
        warning: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
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

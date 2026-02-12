import type { VariantProps } from "class-variance-authority";
import * as React from "react";
import { cva } from "class-variance-authority";
import { Search, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";

import { cn } from "@/lib/utils";
import { Button } from "./button";

const inputVariants = cva(
  "bg-accent/50 focus-visible:border-ring ring-primary focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:aria-invalid:border-destructive/50 disabled:bg-input/50 dark:disabled:bg-input/80 file:text-foreground placeholder:text-muted-foreground w-full min-w-0 rounded-sm px-2.5 py-1 text-xs transition-colors outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-xs file:font-medium focus-visible:ring-1 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:ring-1 md:text-xs",
  {
    variants: {
      size: {
        default: "h-8",
        sm: "h-7 px-2 py-1",
      },
    },
    defaultVariants: {
      size: "default",
    },
  }
);

type InputProps = Omit<React.ComponentProps<"input">, "size"> &
  VariantProps<typeof inputVariants> & {
    onClear?: () => void;
    showSearch?: boolean;
  };

function Input({
  className,
  type,
  onClear,
  showSearch = false,
  value,
  onChange,
  size,
  ...props
}: InputProps) {
  const hasValue = value && value.toString().length > 0;
  const showClearButton = hasValue && onClear;
  const showSearchIcon = showSearch && !hasValue;

  return (
    <div className={cn("relative flex items-center", className)}>
      <input
        type={type}
        data-slot="input"
        value={value}
        onChange={onChange}
        // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
        className={cn(inputVariants({ size }), (onClear || showSearch) && "pr-8", className)}
        {...props}
      />
      <div className="absolute right-1.5 flex items-center justify-center">
        <AnimatePresence mode="wait">
          {showClearButton && (
            <motion.div
              key="close"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{
                duration: 0.15,
                ease: [0.4, 0, 0.2, 1],
              }}
              className="flex items-center justify-center"
            >
              <Button
                type="button"
                variant="link"
                size="icon-xs"
                onClick={onClear}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="size-4" />
              </Button>
            </motion.div>
          )}
          {showSearchIcon && (
            <motion.div
              key="search"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{
                duration: 0.15,
                ease: [0.4, 0, 0.2, 1],
              }}
              className="flex items-center justify-center"
            >
              <Search className="text-muted-foreground size-4" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export { Input, inputVariants };
export type { InputProps };

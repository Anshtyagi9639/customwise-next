import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils/cn";

export const buttonVariants = cva(
  "inline-flex min-h-12 items-center justify-center gap-2 rounded-brand border-2 px-5 py-2.5 text-[0.98rem] font-bold leading-tight transition-colors duration-200 disabled:pointer-events-none disabled:opacity-60 [&_svg]:size-[18px] [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary: "border-transparent bg-cargo text-overnight hover:bg-haul",
        ghost: "border-salt/55 bg-transparent text-salt hover:border-cargo hover:text-cargo",
        outline: "border-atlantic bg-transparent text-atlantic hover:bg-atlantic hover:text-salt",
      },
    },
    defaultVariants: { variant: "primary" },
  },
);

type ButtonProps = ComponentProps<"button"> & VariantProps<typeof buttonVariants> & { asChild?: boolean };

export function Button({ className, variant, asChild = false, ...props }: ButtonProps) {
  const Comp = asChild ? Slot : "button";
  return <Comp className={cn(buttonVariants({ variant }), className)} {...props} />;
}

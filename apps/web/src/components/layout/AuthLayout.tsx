import { ReactNode } from "react";
import { Link } from "wouter";
import { ThemeToggle } from "./ThemeToggle";
import { ArrowLeft } from "lucide-react";

export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-[100dvh] flex flex-col bg-muted/30">
      <div className="flex items-center justify-between px-4 sm:px-8 pt-4 sm:pt-8">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft size={16} />
          Back to home
        </Link>
        <ThemeToggle />
      </div>

      <div className="flex-1 flex flex-col justify-center items-center p-4 sm:p-8">
        <div className="w-full max-w-lg">
          <div className="flex justify-center mb-8">
            <Link href="/" className="flex items-center gap-2.5">
              <img src="/logo.png" alt="Casa Corona" className="h-14 w-14 object-contain" />
              <span className="font-serif font-bold text-2xl tracking-tight text-foreground">Casa Corona</span>
            </Link>
          </div>

          {children}
        </div>
      </div>
    </div>
  );
}

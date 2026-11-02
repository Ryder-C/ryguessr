import { Globe2 } from "lucide-react";

export const LoadingScreen = ({
  message = "Finding somewhere interesting…",
  error,
}: {
  message?: string;
  error?: string;
}) => {
  return (
    <div className="h-dvh w-full bg-background text-foreground flex flex-col items-center justify-center gap-6 bg-[radial-gradient(ellipse_at_center,oklch(0.8_0.17_150/0.12),transparent_60%)]">
      <div className="relative flex items-center justify-center">
        {!error && (
          <span className="absolute inline-flex size-20 rounded-full bg-primary/20 animate-ping" />
        )}
        <div className="relative flex size-16 items-center justify-center rounded-full bg-primary/15 ring-1 ring-primary/40">
          <Globe2
            className={`size-8 text-primary ${error ? "" : "animate-[spin_6s_linear_infinite]"}`}
          />
        </div>
      </div>
      <div className="flex flex-col items-center gap-1.5 text-center px-6">
        <h1 className="text-3xl font-bold tracking-tight">
          ry<span className="text-primary">guessr</span>
        </h1>
        <p
          className={`text-sm ${error ? "text-destructive" : "text-muted-foreground"}`}
        >
          {error ?? message}
        </p>
      </div>
    </div>
  );
};

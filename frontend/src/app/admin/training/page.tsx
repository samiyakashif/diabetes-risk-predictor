"use client";

import { useRef, useState } from "react";
import { Brain, CheckCircle, Database, GitBranch, Layers, Play, TrendingUp, Upload } from "lucide-react";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

const MODELS = [
  { id: "neural", label: "Neural Network", icon: Brain, desc: "Multi-layer perceptron with 3 hidden layers" },
  { id: "svm", label: "Support Vector Machine", icon: GitBranch, desc: "RBF kernel with grid-search hypertuning" },
  { id: "dt", label: "Decision Tree", icon: Layers, desc: "CART algorithm with max depth = 8" },
  { id: "lr", label: "Logistic Regression", icon: TrendingUp, desc: "L2 regularization, liblinear solver" },
];

export default function ModelTrainingPage() {
  const [selected, setSelected] = useState<string[]>(["neural", "svm", "dt", "lr"]);
  const [training, setTraining] = useState(false);
  const [progress, setProgress] = useState<Record<string, number>>({});
  const ticker = useRef(0);

  const startTraining = () => {
    setTraining(true);
    ticker.current = 0;
    const prog: Record<string, number> = {};
    selected.forEach((m) => {
      prog[m] = 0;
    });
    setProgress(prog);
    const iv = window.setInterval(() => {
      ticker.current += 5;
      const jitter = Math.random() * 8;
      setProgress((p) => {
        const next = { ...p };
        selected.forEach((m) => {
          next[m] = Math.min(100, (next[m] || 0) + jitter);
        });
        return next;
      });
      if (ticker.current >= 120) window.clearInterval(iv);
    }, 150);
  };

  const toggle = (id: string) => {
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  };

  const anyComplete = training && Object.values(progress).some((v) => v >= 100);

  return (
    <>
      <SectionHeader
        title="Model Training"
        subtitle="Select models and initiate training on the current dataset."
      />

      <div className="bg-white rounded-xl border border-border p-5 mb-6 flex flex-wrap items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
          <Database size={18} className="text-primary" />
        </div>
        <div className="flex-1 min-w-[200px]">
          <p className="text-sm font-semibold text-foreground">
            Active Dataset: Pima Indians Diabetes Database
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            768 records · 9 features · 34.9% positive rate · Last imported May 20, 2026
          </p>
        </div>
        <Button variant="outline" size="sm" icon={Upload}>
          Import New Dataset
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4 mb-4 md:mb-6">
        {MODELS.map((m) => {
          const isSelected = selected.includes(m.id);
          const prog = progress[m.id];
          return (
            <div
              key={m.id}
              onClick={() => !training && toggle(m.id)}
              className={cn(
                "bg-white rounded-xl border p-5 transition-all",
                isSelected ? "border-primary shadow-sm shadow-primary/10" : "border-border",
                !training && isSelected && "cursor-pointer hover:border-[#A8D9E2]"
              )}
            >
              <div className="flex items-start gap-3 mb-3">
                <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center", isSelected ? "bg-secondary" : "bg-muted")}>
                  <m.icon
                    size={16}
                    className={isSelected ? "text-primary" : "text-muted-foreground"}
                  />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-foreground">{m.label}</p>
                    <div
                      className={cn(
                        "w-4 h-4 rounded border-2 flex items-center justify-center transition-all",
                        isSelected ? "bg-primary border-primary" : "border-gray-300"
                      )}
                    >
                      {isSelected && <CheckCircle size={10} className="text-white" />}
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{m.desc}</p>
                </div>
              </div>
              {training && isSelected && (
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs text-muted-foreground">
                      {prog >= 100 ? "Complete" : "Training..."}
                    </span>
                    <span className="text-xs font-mono font-semibold text-primary">
                      {Math.round(prog || 0)}%
                    </span>
                  </div>
                  <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all duration-300"
                      style={{ width: `${prog || 0}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button variant="primary" size="lg" icon={Play} onClick={startTraining} disabled={training || selected.length === 0}>
          Train {selected.length} Model{selected.length !== 1 ? "s" : ""}
        </Button>
        <p className="text-sm text-muted-foreground">
          {selected.length} of {MODELS.length} models selected
        </p>
      </div>

      {anyComplete && (
        <div className="mt-6 p-4 rounded-xl bg-[#EEF9F4] border border-green-200">
          <div className="flex items-center gap-2 text-[#1A6042] font-semibold text-sm">
            <CheckCircle size={16} />
            Training complete! Navigate to Model Evaluation to compare results.
          </div>
        </div>
      )}
    </>
  );
}
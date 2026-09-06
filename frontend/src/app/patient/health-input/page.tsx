"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Activity, ChevronDown, Info } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { InputField } from "@/components/ui/InputField";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { api, ApiError } from "@/lib/api";
import { usePrediction } from "@/components/prediction/PredictionProvider";
import type { HealthFeatures } from "@/types/health";

interface FormValues {
  age: string;
  gender: string;
  glucose: string;
  bp: string;
  skin: string;
  insulin: string;
  bmi: string;
  dpf: string;
  pregnancies: string;
}

const INITIAL_VALUES: FormValues = {
  age: "",
  gender: "Female",
  glucose: "",
  bp: "",
  skin: "",
  insulin: "",
  bmi: "",
  dpf: "",
  pregnancies: "",
};

export default function HealthInputPage() {
  const router = useRouter();
  const { setPrediction } = usePrediction();
  const [vals, setVals] = useState<FormValues>(INITIAL_VALUES);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const set = (key: keyof FormValues) => (v: string) =>
    setVals((prev) => ({ ...prev, [key]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const features: HealthFeatures = {
      Pregnancies: Number(vals.pregnancies),
      Glucose: Number(vals.glucose),
      BloodPressure: Number(vals.bp),
      SkinThickness: Number(vals.skin),
      Insulin: Number(vals.insulin),
      BMI: Number(vals.bmi),
      DiabetesPedigree: Number(vals.dpf),
      Age: Number(vals.age),
    };

    try {
      const result = await api.predict(features);
      setPrediction(result, features);
      router.push("/patient/prediction");
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        router.push("/login");
        return;
      }
      setError(
        err instanceof ApiError ? err.message : "Could not connect to server"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 md:mb-8">
        <SectionHeader
          title="Health Data Input"
          subtitle="Enter your clinical measurements to generate a diabetes risk prediction."
        />
      </div>

      <div className="bg-white rounded-xl border border-border p-8">
        <div className="flex items-center gap-2 p-3 rounded-lg bg-secondary border border-[#A8D9E2] mb-6 text-sm text-primary">
          <Info size={14} />
          All values should be from your most recent clinical tests. Use metric
          units where possible.
        </div>

        <form onSubmit={handleSubmit} id="health-form">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
            <InputField
              label="Age"
              type="number"
              min={1}
              max={120}
              placeholder="e.g. 42"
              tooltip="Your age in years"
              value={vals.age}
              onChange={set("age")}
              name="age"
              required
            />
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-foreground">
                Gender
              </label>
              <div className="relative">
                <select
                  value={vals.gender}
                  onChange={(e) => set("gender")(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary appearance-none"
                >
                  <option>Female</option>
                  <option>Male</option>
                  <option>Other</option>
                </select>
                <ChevronDown
                  size={14}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
                />
              </div>
            </div>
            <InputField
              label="Glucose Level (mg/dL)"
              type="number"
              min={0}
              max={400}
              step="any"
              placeholder="e.g. 120"
              tooltip="Plasma glucose concentration at 2 hours in an oral glucose tolerance test"
              value={vals.glucose}
              onChange={set("glucose")}
              name="glucose"
              required
            />
            <InputField
              label="Blood Pressure (mm Hg)"
              type="number"
              min={0}
              max={300}
              step="any"
              placeholder="e.g. 72"
              tooltip="Diastolic blood pressure measurement"
              value={vals.bp}
              onChange={set("bp")}
              name="blood_pressure"
              required
            />
            <InputField
              label="Skin Thickness (mm)"
              type="number"
              min={0}
              max={100}
              step="any"
              placeholder="e.g. 23"
              tooltip="Triceps skin fold thickness"
              value={vals.skin}
              onChange={set("skin")}
              name="skin_thickness"
              required
            />
            <InputField
              label="Insulin Level (µU/mL)"
              type="number"
              min={0}
              max={900}
              step="any"
              placeholder="e.g. 85"
              tooltip="2-hour serum insulin level"
              value={vals.insulin}
              onChange={set("insulin")}
              name="insulin"
              required
            />
            <InputField
              label="BMI (kg/m²)"
              type="number"
              min={10}
              max={70}
              step="any"
              placeholder="e.g. 28.1"
              tooltip="Body mass index = weight(kg) / height(m)²"
              value={vals.bmi}
              onChange={set("bmi")}
              name="bmi"
              required
            />
            <InputField
              label="Diabetes Pedigree Function"
              type="number"
              min={0}
              max={3}
              step="any"
              placeholder="e.g. 0.627"
              tooltip="A function that scores likelihood of diabetes based on family history"
              value={vals.dpf}
              onChange={set("dpf")}
              name="diabetes_pedigree"
              required
            />
            <InputField
              label="Number of Pregnancies"
              type="number"
              min={0}
              max={20}
              placeholder="e.g. 2"
              tooltip="Number of times pregnant (enter 0 if not applicable)"
              value={vals.pregnancies}
              onChange={set("pregnancies")}
              name="pregnancies"
              required
            />
          </div>

          {error && (
            <p className="mt-6 text-sm text-destructive bg-destructive/5 border border-destructive/20 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <div className="mt-6 md:mt-8 pt-5 md:pt-6 border-t border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground">
              Data is processed locally. Not stored without your consent.
            </p>
            <div className="flex gap-3">
              <Button variant="outline" type="button">
                Save Draft
              </Button>
              <Button
                variant="primary"
                icon={Activity}
                type="submit"
                disabled={loading}
              >
                {loading ? "Running..." : "Run Prediction"}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
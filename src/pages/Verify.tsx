import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { GovHeader } from "@/components/GovHeader";
import { toast } from "sonner";
import { ShieldCheck } from "lucide-react";

const schema = z.object({
  pollCard: z.string().trim().min(4, "Required").max(50),
  ni: z
    .string()
    .trim()
    .regex(
      /^[A-Za-z]{2}\s?\d{2}\s?\d{2}\s?\d{2}\s?[A-Za-z]$/,
      "Format: AB123456C",
    ),
  lastName: z.string().trim().min(1, "Required").max(80),
  address: z.string().trim().min(5, "Required").max(200),
  dob: z.string().min(1, "Required"),
});

export default function Verify() {
  const nav = useNavigate();
  const [step, setStep] = useState(0);
  const [data, setData] = useState({
    pollCard: "",
    ni: "",
    lastName: "",
    address: "",
    dob: "",
  });
  const [busy, setBusy] = useState(false);

  const fields = [
    {
      key: "pollCard",
      label: "Electoral identifier / Poll card reference",
      placeholder: "e.g. PC100001",
      help: "Found on the top of your poll card.",
    },
    {
      key: "ni",
      label: "National Insurance number",
      placeholder: "AB123456C",
      help: "Format: two letters, six digits, one letter.",
    },
    {
      key: "lastName",
      label: "Last name",
      placeholder: "Surname",
      help: "As shown on the electoral register.",
    },
    {
      key: "address",
      label: "Registered home address",
      placeholder: "10 Downing Street, London",
      help: "Your full registered address.",
    },
    {
      key: "dob",
      label: "Date of birth",
      placeholder: "",
      help: "Used to confirm your identity.",
      type: "date",
    },
  ] as const;

  const cur = fields[step];

  const next = () => {
    const v = (data as any)[cur.key];
    if (!v) {
      toast.error("This field is required");
      return;
    }
    if (step < fields.length - 1) setStep(step + 1);
    else submit();
  };

  const submit = async () => {
    const parsed = schema.safeParse(data);
    if (!parsed.success) {
      toast.error(parsed.error.errors[0].message);
      setStep(0);
      return;
    }
    setBusy(true);
    setTimeout(() => {
      setBusy(false);
      toast.success("Identity verified");
      nav("/vote");
    }, 400);
  };

  return (
    <div className="min-h-screen bg-background">
      <GovHeader />
      <div className="max-w-2xl mx-auto px-4 pt-6">
        <button
          onClick={() => nav("/")}
          className="text-accent underline text-base"
        >
          ‹ Back
        </button>
      </div>
      <main className="max-w-2xl mx-auto px-4 py-10">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary/10 mb-4">
            <ShieldCheck className="w-7 h-7 text-primary" />
          </div>
          <h1 className="text-3xl font-bold">Voter identity verification</h1>
          <p className="text-muted-foreground mt-2">
            We check your details against the electoral register before issuing
            your ballot.
          </p>
        </div>

        <Card className="shadow-[var(--shadow-card)]">
          <CardHeader>
            <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
              <span>
                Step {step + 1} of {fields.length}
              </span>
              <span>{Math.round(((step + 1) / fields.length) * 100)}%</span>
            </div>
            <div className="h-2 bg-secondary rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all"
                style={{ width: `${((step + 1) / fields.length) * 100}%` }}
              />
            </div>
            <CardTitle className="pt-4">{cur.label}</CardTitle>
            <CardDescription>{cur.help}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor={cur.key}>{cur.label}</Label>
              <Input
                id={cur.key}
                type={(cur as any).type || "text"}
                placeholder={cur.placeholder}
                value={(data as any)[cur.key]}
                onChange={(e) =>
                  setData({ ...data, [cur.key]: e.target.value })
                }
                onKeyDown={(e) => e.key === "Enter" && next()}
              />
            </div>
            <div className="flex gap-3">
              {step > 0 && (
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setStep(step - 1)}
                >
                  Back
                </Button>
              )}
              <Button
                className="flex-1"
                size="lg"
                disabled={busy}
                onClick={next}
              >
                {step < fields.length - 1
                  ? "Continue"
                  : busy
                    ? "Verifying…"
                    : "Verify identity"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

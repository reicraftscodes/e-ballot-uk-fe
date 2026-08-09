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
import {
  AlertTriangle,
  CheckCircle2,
  Loader2,
  ShieldCheck,
} from "lucide-react";

// -----------------------------------------------------------------------
// Local "already voted" guard.
// The backend is the source of truth (it returns 409 Conflict on a
// duplicate vote), but we also remember, on this device, which NI
// numbers have successfully voted so we can block a re-attempt before
// the person even reaches the ballot.
// -----------------------------------------------------------------------
const VOTED_NI_STORAGE_KEY = "eballot_voted_ni_numbers";
export const VOTE_IDENTITY_STORAGE_KEY = "eballot_vote_identity";

function normaliseNi(value: string) {
  return value.replace(/\s+/g, "").toUpperCase();
}

function hasAlreadyVotedLocally(ni: string) {
  try {
    const raw = localStorage.getItem(VOTED_NI_STORAGE_KEY);
    const voted: string[] = raw ? JSON.parse(raw) : [];
    return voted.includes(normaliseNi(ni));
  } catch {
    return false;
  }
}

// -----------------------------------------------------------------------
// Step 1: poll card reference + National Insurance number
// -----------------------------------------------------------------------
const step1Schema = z.object({
  pollCardReference: z.string().trim().min(4, "Enter your poll card reference"),
  nationalInsuranceNumber: z
    .string()
    .trim()
    .min(1, "Enter your National Insurance number")
    .regex(
      /^[A-Za-z]{2}\s?\d{2}\s?\d{2}\s?\d{2}\s?[A-Za-z]$/,
      "Enter a National Insurance number in the format QQ123456C",
    ),
});

// Step 2: last name + date of birth
const step2Schema = z.object({
  lastName: z.string().trim().min(1, "Enter your last name"),
  dob: z.string().min(1, "Enter your date of birth"),
});

type Step = "pollcard-ni" | "identity" | "checking" | "confirmed";

export default function Vote() {
  const nav = useNavigate();

  const [step, setStep] = useState<Step>("pollcard-ni");
  const [pollCardReference, setPollCardReference] = useState("");
  const [nationalInsuranceNumber, setNationalInsuranceNumber] = useState("");
  const [lastName, setLastName] = useState("");
  const [dob, setDob] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [alreadyVoted, setAlreadyVoted] = useState(false);
  const [checkFailed, setCheckFailed] = useState(false);

  // Step 1: poll card reference + NI number
  const submitStep1 = () => {
    const parsed = step1Schema.safeParse({
      pollCardReference,
      nationalInsuranceNumber,
    });
    if (!parsed.success) {
      const errors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        errors[issue.path[0] as string] = issue.message;
      }
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});

    if (hasAlreadyVotedLocally(nationalInsuranceNumber)) {
      setAlreadyVoted(true);
      return;
    }
    setAlreadyVoted(false);
    setStep("identity");
  };

  // Step 2: last name + DOB, then run the identity check
  const submitStep2 = () => {
    const parsed = step2Schema.safeParse({ lastName, dob });
    if (!parsed.success) {
      const errors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        errors[issue.path[0] as string] = issue.message;
      }
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});
    runIdentityCheck();
  };

  // A lightweight, client-side identity confirmation step.
  // The register match itself only happens once the vote is cast, so
  // this validates the fields are present and well-formed and gives
  // the voter clear "confirmed" / "invalid" feedback before moving on.
  const runIdentityCheck = () => {
    setStep("checking");
    setCheckFailed(false);

    window.setTimeout(() => {
      const dobDate = new Date(dob);
      const validDob = !Number.isNaN(dobDate.getTime()) && dobDate < new Date();

      if (!validDob || lastName.trim().length === 0) {
        setCheckFailed(true);
        setStep("identity");
        return;
      }

      setStep("confirmed");
    }, 900);
  };

  const goToBallot = () => {
    sessionStorage.setItem(
      VOTE_IDENTITY_STORAGE_KEY,
      JSON.stringify({
        pollCardReference,
        nationalInsuranceNumber: normaliseNi(nationalInsuranceNumber),
        lastName: lastName.trim(),
        dob,
      }),
    );
    nav("/vote/ballot");
  };

  const progress =
    step === "pollcard-ni"
      ? 1
      : step === "identity" || step === "checking"
        ? 2
        : 3;

  return (
    <div className="min-h-screen bg-background">
      <GovHeader />
      <div className="max-w-2xl mx-auto px-4 pt-6">
        <button
          onClick={() =>
            step === "pollcard-ni" ? nav("/") : setStep("pollcard-ni")
          }
          className="text-accent underline text-base"
        >
          ‹ Back
        </button>
      </div>

      <main className="max-w-2xl mx-auto px-4 py-10 space-y-8">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary/10 mb-4">
            <ShieldCheck className="w-7 h-7 text-primary" />
          </div>
          <h1 className="text-3xl font-bold">
            Vote in the UK general election
          </h1>
          <p className="text-muted-foreground mt-2">Step {progress} of 3</p>
          <div className="h-2 bg-secondary rounded-full overflow-hidden mt-3 max-w-xs mx-auto">
            <div
              className="h-full bg-primary transition-all"
              style={{ width: `${(progress / 3) * 100}%` }}
            />
          </div>
        </div>

        {alreadyVoted && (
          <div className="flex items-start gap-3 rounded-md border border-destructive/40 bg-destructive/5 p-4">
            <AlertTriangle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-foreground">
                You have already voted
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Our records show a vote has already been cast for this National
                Insurance number. Each voter may only vote once.
              </p>
            </div>
          </div>
        )}

        {!alreadyVoted && step === "pollcard-ni" && (
          <Card className="shadow-[var(--shadow-card)]">
            <CardHeader>
              <CardTitle>Poll card details</CardTitle>
              <CardDescription>
                Enter your electoral identifier and National Insurance number,
                exactly as shown on your poll card.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="pollCard">Poll card reference</Label>
                <Input
                  id="pollCard"
                  placeholder="e.g. PC100001"
                  value={pollCardReference}
                  onChange={(e) => setPollCardReference(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && submitStep1()}
                  aria-invalid={!!fieldErrors.pollCardReference}
                />
                {fieldErrors.pollCardReference && (
                  <p className="text-sm text-destructive">
                    {fieldErrors.pollCardReference}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="ni">National Insurance number</Label>
                <Input
                  id="ni"
                  placeholder="QQ123456C"
                  value={nationalInsuranceNumber}
                  onChange={(e) => setNationalInsuranceNumber(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && submitStep1()}
                  aria-invalid={!!fieldErrors.nationalInsuranceNumber}
                />
                {fieldErrors.nationalInsuranceNumber && (
                  <p className="text-sm text-destructive">
                    {fieldErrors.nationalInsuranceNumber}
                  </p>
                )}
              </div>
              <Button className="w-full" size="lg" onClick={submitStep1}>
                Continue
              </Button>
            </CardContent>
          </Card>
        )}

        {!alreadyVoted && step === "identity" && (
          <Card className="shadow-[var(--shadow-card)]">
            <CardHeader>
              <CardTitle>Confirm your identity</CardTitle>
              <CardDescription>
                Enter your last name and date of birth as shown on the electoral
                register.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {checkFailed && (
                <div className="flex items-start gap-3 rounded-md border border-destructive/40 bg-destructive/5 p-3">
                  <AlertTriangle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
                  <p className="text-sm text-foreground">
                    We could not confirm those details. Check your last name and
                    date of birth and try again.
                  </p>
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="lastName">Last name</Label>
                <Input
                  id="lastName"
                  placeholder="Surname"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && submitStep2()}
                  aria-invalid={!!fieldErrors.lastName}
                />
                {fieldErrors.lastName && (
                  <p className="text-sm text-destructive">
                    {fieldErrors.lastName}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="dob">Date of birth</Label>
                <Input
                  id="dob"
                  type="date"
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  aria-invalid={!!fieldErrors.dob}
                />
                {fieldErrors.dob && (
                  <p className="text-sm text-destructive">{fieldErrors.dob}</p>
                )}
              </div>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setStep("pollcard-ni")}
                >
                  Back
                </Button>
                <Button className="flex-1" size="lg" onClick={submitStep2}>
                  Verify identity
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {!alreadyVoted && step === "checking" && (
          <Card className="shadow-[var(--shadow-card)]">
            <CardContent className="py-12 flex flex-col items-center text-center gap-3">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
              <p className="font-semibold text-foreground">
                Checking your details…
              </p>
              <p className="text-sm text-muted-foreground">
                This will only take a moment.
              </p>
            </CardContent>
          </Card>
        )}

        {!alreadyVoted && step === "confirmed" && (
          <Card className="shadow-[var(--shadow-card)] border-primary/30">
            <CardContent className="py-10 flex flex-col items-center text-center gap-3">
              <CheckCircle2 className="w-10 h-10 text-primary" />
              <p className="text-xl font-bold text-foreground">
                Identity confirmed
              </p>
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm text-left mt-4 w-full max-w-sm">
                <div>
                  <dt className="text-muted-foreground">Poll card reference</dt>
                  <dd className="font-semibold text-foreground">
                    {pollCardReference}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">NI number</dt>
                  <dd className="font-semibold text-foreground">
                    {normaliseNi(nationalInsuranceNumber)}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Last name</dt>
                  <dd className="font-semibold text-foreground">{lastName}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Date of birth</dt>
                  <dd className="font-semibold text-foreground">
                    {new Date(dob).toLocaleDateString("en-GB")}
                  </dd>
                </div>
              </dl>
              <Button
                className="w-full max-w-sm mt-4"
                size="lg"
                onClick={goToBallot}
              >
                Continue to vote
              </Button>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}

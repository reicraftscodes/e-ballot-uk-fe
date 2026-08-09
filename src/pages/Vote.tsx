import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import {
  votingService,
  ApiError,
  type PartyListDto,
} from "@/config/apiConfig";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { GovHeader } from "@/components/GovHeader";
import { toast } from "sonner";
import { CheckCircle2, AlertTriangle } from "lucide-react";

// Matches backend validation on CastVoteRequestDto (NotBlank fields).
// The NI format check is a client-side UX hint only — the backend does
// the real lookup against the electoral register.
const identitySchema = z.object({
  nationalInsuranceNumber: z
    .string()
    .trim()
    .min(1, "Enter your National Insurance number")
    .regex(
      /^[A-Za-z]{2}\s?\d{2}\s?\d{2}\s?\d{2}\s?[A-Za-z]$/,
      "Enter a National Insurance number in the format QQ123456C",
    ),
  lastName: z.string().trim().min(1, "Enter your last name"),
});

type PartiesState =
  | { status: "loading" }
  | { status: "error" }
  | { status: "ready"; parties: PartyListDto[] };

export default function Vote() {
  const nav = useNavigate();

  const [nationalInsuranceNumber, setNationalInsuranceNumber] = useState("");
  const [lastName, setLastName] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const [partiesState, setPartiesState] = useState<PartiesState>({
    status: "loading",
  });
  const [selectedPartyId, setSelectedPartyId] = useState<number | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const loadParties = async () => {
    setPartiesState({ status: "loading" });
    try {
      const { data } = await votingService.getParties();
      setPartiesState({ status: "ready", parties: data });
    } catch {
      setPartiesState({ status: "error" });
    }
  };

  useEffect(() => {
    loadParties();
  }, []);

  const selectedParty =
    partiesState.status === "ready"
      ? partiesState.parties.find((p) => p.id === selectedPartyId)
      : undefined;

  const validate = () => {
    const parsed = identitySchema.safeParse({
      nationalInsuranceNumber,
      lastName,
    });
    if (!parsed.success) {
      const errors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        errors[issue.path[0] as string] = issue.message;
      }
      setFieldErrors(errors);
      return false;
    }
    setFieldErrors({});
    return true;
  };

  const openConfirm = () => {
    if (!validate()) {
      toast.error("Check your details before continuing");
      return;
    }
    if (!selectedPartyId) {
      toast.error("Select a party to continue");
      return;
    }
    setSubmitError(null);
    setConfirmOpen(true);
  };

  const cast = async () => {
    if (!selectedPartyId) return;
    setBusy(true);
    setSubmitError(null);
    try {
      const { data } = await votingService.castVote({
        nationalInsuranceNumber: nationalInsuranceNumber.trim(),
        lastName: lastName.trim(),
        partyId: selectedPartyId,
      });

      sessionStorage.setItem("voteReferenceNo", data.referenceNo);
      sessionStorage.setItem("voteTimestamp", data.timestamp);
      sessionStorage.setItem("votedPartyName", selectedParty?.partyName ?? "");
      nav("/vote/receipt");
    } catch (e) {
      const err = e as ApiError;
      // Map backend status codes to the outcomes in the verification /
      // voting sequence diagram (400 invalid details, 403 ineligible,
      // 404 party not found, 409 duplicate vote).
      let message = err.message || "Could not cast your vote. Try again.";
      if (err.status === 400) {
        message =
          "We could not match those details against the electoral register. Check your National Insurance number and last name.";
      } else if (err.status === 403) {
        message = "You do not meet the minimum age to vote.";
      } else if (err.status === 404) {
        message = "That party could not be found. Refresh and try again.";
      } else if (err.status === 409) {
        message = "A vote has already been cast for this voter.";
      }
      setSubmitError(message);
      setConfirmOpen(false);
      toast.error(message);
    } finally {
      setBusy(false);
    }
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
      <main className="max-w-2xl mx-auto px-4 py-10 space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Your ballot</h1>
          <p className="text-muted-foreground mt-2">
            Confirm your details, then select one party to vote for.
          </p>
        </div>

        {/* Verification Flow (Identity): NI number + last name — the two
            fields the backend uses to look up the voter record. */}
        <Card className="shadow-[var(--shadow-card)]">
          <CardHeader>
            <CardTitle>Confirm your identity</CardTitle>
            <CardDescription>
              We check these details against the electoral register when you
              submit your vote.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="ni">National Insurance number</Label>
              <Input
                id="ni"
                placeholder="QQ123456C"
                value={nationalInsuranceNumber}
                onChange={(e) => setNationalInsuranceNumber(e.target.value)}
                aria-invalid={!!fieldErrors.nationalInsuranceNumber}
              />
              {fieldErrors.nationalInsuranceNumber && (
                <p className="text-sm text-destructive">
                  {fieldErrors.nationalInsuranceNumber}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last name</Label>
              <Input
                id="lastName"
                placeholder="Surname, as shown on the electoral register"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                aria-invalid={!!fieldErrors.lastName}
              />
              {fieldErrors.lastName && (
                <p className="text-sm text-destructive">
                  {fieldErrors.lastName}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Voting Process: party list fetched from the backend. */}
        <Card className="shadow-[var(--shadow-card)]">
          <CardHeader>
            <CardTitle>Select one party</CardTitle>
            <CardDescription>
              This is final and cannot be changed once submitted.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {partiesState.status === "loading" && (
              <p className="text-muted-foreground">Loading parties…</p>
            )}

            {partiesState.status === "error" && (
              <div className="flex items-start gap-3 rounded-md border border-destructive/40 bg-destructive/5 p-4">
                <AlertTriangle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
                <div className="space-y-2">
                  <p className="text-sm text-foreground">
                    We could not load the list of parties.
                  </p>
                  <Button variant="outline" size="sm" onClick={loadParties}>
                    Try again
                  </Button>
                </div>
              </div>
            )}

            {partiesState.status === "ready" && partiesState.parties.length === 0 && (
              <p className="text-muted-foreground">
                No parties are available to vote for right now.
              </p>
            )}

            {partiesState.status === "ready" &&
              partiesState.parties.map((party) => (
                <label
                  key={party.id}
                  htmlFor={`party-${party.id}`}
                  className={`flex items-center justify-between p-4 rounded-lg border cursor-pointer transition-all ${
                    selectedPartyId === party.id
                      ? "border-primary bg-primary/5 ring-2 ring-primary/30"
                      : "border-border hover:bg-secondary"
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <input
                      type="radio"
                      id={`party-${party.id}`}
                      name="party"
                      value={party.id}
                      checked={selectedPartyId === party.id}
                      onChange={() => setSelectedPartyId(party.id)}
                      className="h-4 w-4 accent-primary"
                    />
                    <span>
                      <span className="block font-semibold text-foreground">
                        {party.partyName}
                      </span>
                      <span className="block text-sm text-muted-foreground">
                        {party.position}
                      </span>
                    </span>
                  </span>
                  {selectedPartyId === party.id && (
                    <CheckCircle2 className="w-5 h-5 text-primary" />
                  )}
                </label>
              ))}

            {submitError && (
              <p className="text-sm text-destructive" role="alert">
                {submitError}
              </p>
            )}

            <Button
              className="w-full mt-4"
              size="lg"
              disabled={
                !selectedPartyId || busy || partiesState.status !== "ready"
              }
              onClick={openConfirm}
            >
              Submit vote
            </Button>
          </CardContent>
        </Card>
      </main>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm your vote</AlertDialogTitle>
            <AlertDialogDescription>
              You're about to cast your vote for{" "}
              <span className="font-semibold text-foreground">
                {selectedParty?.partyName}
              </span>
              . This is final and cannot be changed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>Cancel</AlertDialogCancel>
            <AlertDialogAction disabled={busy} onClick={cast}>
              {busy ? "Submitting…" : "Confirm vote"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

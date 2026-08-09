import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  votingService,
  ApiError,
  type PartyListDto,
} from "@/config/apiConfig";
import { Button } from "@/components/ui/button";
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
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { VOTE_IDENTITY_STORAGE_KEY } from "./Vote";

const VOTED_NI_STORAGE_KEY = "eballot_voted_ni_numbers";

interface VoteIdentity {
  pollCardReference: string;
  nationalInsuranceNumber: string;
  lastName: string;
  dob: string;
}

function rememberVoted(ni: string) {
  try {
    const raw = localStorage.getItem(VOTED_NI_STORAGE_KEY);
    const voted: string[] = raw ? JSON.parse(raw) : [];
    const next = Array.from(new Set([...voted, ni.toUpperCase()]));
    localStorage.setItem(VOTED_NI_STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Non-critical — the backend's duplicate-vote check is authoritative.
  }
}

type PartiesState =
  | { status: "loading" }
  | { status: "error" }
  | { status: "ready"; parties: PartyListDto[] };

export default function VoteBallot() {
  const nav = useNavigate();

  const [identity, setIdentity] = useState<VoteIdentity | null>(null);
  const [partiesState, setPartiesState] = useState<PartiesState>({
    status: "loading",
  });
  const [selectedPartyId, setSelectedPartyId] = useState<number | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // This page only makes sense after the verification flow on /vote.
  // If someone lands here directly (or refreshes and lost the identity
  // in sessionStorage), send them back to start over.
  useEffect(() => {
    const raw = sessionStorage.getItem(VOTE_IDENTITY_STORAGE_KEY);
    if (!raw) {
      nav("/vote", { replace: true });
      return;
    }
    setIdentity(JSON.parse(raw));
  }, [nav]);

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
    if (identity) loadParties();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [identity]);

  const selectedParty =
    partiesState.status === "ready"
      ? partiesState.parties.find((p) => p.id === selectedPartyId)
      : undefined;

  const openConfirm = () => {
    if (!selectedPartyId) {
      toast.error("Select a party to continue");
      return;
    }
    setSubmitError(null);
    setConfirmOpen(true);
  };

  const cast = async () => {
    if (!identity || !selectedPartyId) return;
    setBusy(true);
    setSubmitError(null);
    try {
      const { data } = await votingService.castVote({
        nationalInsuranceNumber: identity.nationalInsuranceNumber,
        lastName: identity.lastName,
        partyId: selectedPartyId,
      });

      rememberVoted(identity.nationalInsuranceNumber);
      sessionStorage.removeItem(VOTE_IDENTITY_STORAGE_KEY);
      sessionStorage.setItem("voteReferenceNo", data.referenceNo);
      sessionStorage.setItem("voteTimestamp", data.timestamp);
      sessionStorage.setItem("votedPartyName", selectedParty?.partyName ?? "");
      nav("/vote/receipt");
    } catch (e) {
      const err = e as ApiError;
      let message = err.message || "Could not cast your vote. Try again.";
      if (err.status === 400) {
        message =
          "We could not match those details against the electoral register. Check your National Insurance number and last name.";
      } else if (err.status === 403) {
        message = "You do not meet the minimum age to vote.";
      } else if (err.status === 404) {
        message = "That party could not be found. Refresh and try again.";
      } else if (err.status === 409) {
        rememberVoted(identity.nationalInsuranceNumber);
        message = "A vote has already been cast for this voter.";
      }
      setSubmitError(message);
      setConfirmOpen(false);
      toast.error(message);
    } finally {
      setBusy(false);
    }
  };

  if (!identity) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <GovHeader />
      <div className="max-w-2xl mx-auto px-4 pt-6">
        <button
          onClick={() => nav("/vote")}
          className="text-accent underline text-base"
        >
          ‹ Back
        </button>
      </div>
      <main className="max-w-2xl mx-auto px-4 py-10">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold">Your ballot</h1>
          <p className="text-muted-foreground mt-2">
            Voting as{" "}
            <span className="font-semibold text-foreground">
              {identity.lastName}
            </span>{" "}
            · NI {identity.nationalInsuranceNumber}
          </p>
        </div>

        <Card className="shadow-[var(--shadow-card)]">
          <CardHeader>
            <CardTitle>Select a party</CardTitle>
            <CardDescription>
              Your vote is recorded against your verified identity.
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

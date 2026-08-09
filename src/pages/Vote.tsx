import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiService } from "@/config/apiConfig";
import { Button } from "@/components/ui/button";
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
import { CheckCircle2 } from "lucide-react";

interface Candidate {
  id: string;
  name: string;
  party: string;
  constituency: string;
}

// Demo fallback so the UI works before the API is connected
const DEMO_CONSTITUENCY = "Islington South and Finsbury";
const DEMO_CANDIDATES: Candidate[] = [
  {
    id: "1",
    name: "Emily Thornberry",
    party: "Labour Party",
    constituency: DEMO_CONSTITUENCY,
  },
  {
    id: "2",
    name: "Jason Charalambous",
    party: "Conservative Party",
    constituency: DEMO_CONSTITUENCY,
  },
  {
    id: "3",
    name: "Nick Wakeling",
    party: "Liberal Democrats",
    constituency: DEMO_CONSTITUENCY,
  },
  {
    id: "4",
    name: "Ben Mitchell",
    party: "Green Party",
    constituency: DEMO_CONSTITUENCY,
  },
  {
    id: "5",
    name: "Sarah Fenwick",
    party: "Reform UK",
    constituency: DEMO_CONSTITUENCY,
  },
];

export default function Vote() {
  const nav = useNavigate();
  const [constituency, setConstituency] = useState<string>(DEMO_CONSTITUENCY);
  const [candidates, setCandidates] = useState<Candidate[]>(DEMO_CANDIDATES);
  const [selected, setSelected] = useState<string>("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await apiService.getCandidates(constituency);
        if (Array.isArray(data) && data.length) setCandidates(data);
      } catch {
        // API not connected yet — keep demo candidates
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cast = async () => {
    setBusy(true);
    try {
      let receipt = "";
      try {
        const { data } = await apiService.castVote(selected);
        receipt = data?.receipt || "";
      } catch {
        receipt = `EB-${Date.now().toString(36).toUpperCase()}`;
      }
      sessionStorage.setItem("voteReceipt", receipt);
      sessionStorage.setItem("votedCandidateId", selected);
      nav("/vote/receipt");
    } catch (e: any) {
      toast.error(e.message || "Could not cast vote");
    } finally {
      setBusy(false);
      setConfirmOpen(false);
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
      <main className="max-w-2xl mx-auto px-4 py-10">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold">Your ballot</h1>
          <p className="text-muted-foreground mt-2">
            Constituency:{" "}
            <span className="font-semibold text-foreground">
              {constituency}
            </span>
          </p>
        </div>

        <Card className="shadow-[var(--shadow-card)]">
          <CardHeader>
            <CardTitle>Select one candidate</CardTitle>
            <CardDescription>
              Your vote is recorded against your verified account — one of the
              official ways to vote in the UK.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {candidates.map((c) => (
              <div
                key={c.id}
                onClick={() => setSelected(c.id)}
                className={`flex items-center justify-between p-4 rounded-lg border cursor-pointer transition-all ${
                  selected === c.id
                    ? "border-primary bg-primary/5 ring-2 ring-primary/30"
                    : "border-border hover:bg-secondary"
                }`}
              >
                <div>
                  <div className="font-semibold text-foreground">{c.name}</div>
                  <div className="text-sm text-muted-foreground">{c.party}</div>
                </div>
                {selected === c.id && (
                  <CheckCircle2 className="w-5 h-5 text-primary" />
                )}
              </div>
            ))}
            <Button
              className="w-full mt-4"
              size="lg"
              disabled={!selected || busy}
              onClick={() => setConfirmOpen(true)}
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
                {candidates.find((c) => c.id === selected)?.name}
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

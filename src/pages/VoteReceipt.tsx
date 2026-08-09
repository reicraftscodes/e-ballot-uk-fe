import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { GovHeader } from "@/components/GovHeader";

export default function VoteReceipt() {
  const nav = useNavigate();
  const referenceNo = sessionStorage.getItem("voteReferenceNo");
  const timestampRaw = sessionStorage.getItem("voteTimestamp");
  const votedPartyName = sessionStorage.getItem("votedPartyName");

  // If someone lands here without having cast a vote in this session,
  // send them back to the ballot instead of showing an empty receipt.
  useEffect(() => {
    if (!referenceNo) {
      nav("/vote", { replace: true });
    }
  }, [referenceNo, nav]);

  if (!referenceNo) {
    return null;
  }

  const ts = timestampRaw
    ? new Date(timestampRaw).toLocaleString("en-GB")
    : new Date().toLocaleString("en-GB");

  return (
    <div className="min-h-screen bg-background">
      <GovHeader />
      <main className="max-w-2xl mx-auto px-4 py-12">
        {/* GDS confirmation panel */}
        <div className="bg-primary text-primary-foreground p-8 text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-3">
            Vote submitted
          </h1>
          <p className="text-lg">
            Your reference number
            <br />
            <strong className="text-2xl font-bold">{referenceNo}</strong>
          </p>
        </div>
        <p className="text-lg mb-4">
          Your vote{votedPartyName ? ` for ${votedPartyName}` : ""} has been
          securely recorded against your verified identity.
        </p>
        <p className="mb-6">
          <span className="text-muted-foreground">Timestamp:</span>{" "}
          <strong>{ts}</strong>
        </p>

        <h2 className="text-2xl font-bold mb-3">What happens next</h2>
        <p className="mb-6">
          Keep your reference number for your records. Results will be
          published after polls close.
        </p>

        <Button size="lg" variant="outline" onClick={() => nav("/")}>
          Back to home
        </Button>
      </main>
    </div>
  );
}

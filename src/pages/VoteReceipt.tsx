import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { GovHeader } from "@/components/GovHeader";

export default function VoteReceipt() {
  const nav = useNavigate();
  const receipt = sessionStorage.getItem("voteReceipt") || "—";
  const ts = new Date().toLocaleString("en-GB");

  useEffect(() => {
    sessionStorage.setItem("hasVoted", "1");
  }, []);

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
            <strong className="text-2xl font-bold">{receipt}</strong>
          </p>
        </div>
        <p className="text-lg mb-4">
          Your vote has been securely recorded against your verified account.
        </p>
        <p className="mb-6">
          <span className="text-muted-foreground">Timestamp:</span>{" "}
          <strong>{ts}</strong>
        </p>

        <h2 className="text-2xl font-bold mb-3">What happens next</h2>
        <p className="mb-6">
          Results will be published after polls close. You can view live results
          once available.
        </p>

        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            size="lg"
            onClick={() => {
              sessionStorage.setItem("hasVoted", "1");
              nav("/admin");
            }}
          >
            View results
          </Button>
          <Button variant="outline" size="lg" onClick={() => nav("/")}>
            Back to home
          </Button>
        </div>
      </main>
    </div>
  );
}

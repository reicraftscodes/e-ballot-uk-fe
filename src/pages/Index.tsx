import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { GovHeader } from "@/components/GovHeader";

function Index() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <GovHeader />

      <main className="max-w-3xl mx-auto px-4 py-12 w-full flex-1">
        <div className="space-y-6">
          <h1 className="text-4xl md:text-5xl font-bold">
            Vote in the UK general election
          </h1>
          <p className="text-xl text-foreground">
            Use this service to cast your vote securely — one of the official
            ways to vote in the UK.
          </p>
          <p>It takes around 2 minutes.</p>

          <Button size="lg" asChild className="text-lg px-6 py-4 h-auto">
            <Link to="/vote">
              Start now
              <svg
                className="ml-2"
                width="18"
                height="19"
                viewBox="0 0 33 40"
                aria-hidden="true"
              >
                <path fill="currentColor" d="M0 0h13l20 20-20 20H0l20-20z" />
              </svg>
            </Link>
          </Button>

          <div className="pt-6 border-t border-border space-y-3">
            <h2 className="text-2xl font-bold">Before you start</h2>
            <p>You'll need:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>your National Insurance number</li>
              <li>your last name, as shown on the electoral register</li>
            </ul>
          </div>
        </div>
      </main>

      <footer className="bg-secondary border-t-[10px] border-accent mt-12">
        <div className="max-w-5xl mx-auto px-4 py-8 text-sm text-muted-foreground">
          <p>
            Built by the{" "}
            <span className="font-semibold">UK Voting Service</span>. All
            content is available under the Open Government Licence v3.0, except
            where otherwise stated.
          </p>
        </div>
      </footer>
    </div>
  );
}

export default Index;

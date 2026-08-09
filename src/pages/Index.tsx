import { Link } from "react-router-dom";
import { GovHeader } from "@/components/GovHeader";

function Index() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <GovHeader />

      <main className="max-w-3xl mx-auto px-4 py-12 w-full flex-1">
        <div className="space-y-6">
          <h1 className="text-4xl md:text-5xl font-bold">
            Prefer not to visit a polling station?
          </h1>
          <p className="text-xl text-foreground">
            Use this service to cast your vote online without having to visit a
            polling station.
          </p>
          <p>It takes around 5 minutes.</p>

          <Link
            to="/vote"
            className=" inline-flex items-center bg-[#00703c] text-white font-bold text-lg px-6 py-3
          min-h-[60px]
          no-underline
          shadow-[0_2px_0_#00401e]
          hover:bg-[#005a30]
          hover:shadow-[0_2px_0_#002d16]
          focus:outline-none
          focus:ring-4
          focus:ring-[#ffdd00]
          focus:ring-offset-2
          "
          >
            <span>Start now</span>

            <svg
              className="ml-3 shrink-0"
              width="17.5"
              height="19"
              viewBox="0 0 33 40"
              aria-hidden="true"
              focusable="false"
            >
              <path fill="currentColor" d="M0 0h13l20 20-20 20H0l20-20z" />
            </svg>
          </Link>

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

      <footer className="mt-16 border-t-[10px] border-[#1d70b8] bg-[#f3f2f1]">
        <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="border-b border-[#b1b4b6] pb-6">
            <p className="text-sm text-[#505a5f]">
              This is a personal project and is not affiliated with or endorsed
              by the UK Government, Electoral Commission, or any local
              authority.
            </p>
          </div>

          <div className="pt-6">
            <p className="text-sm text-[#505a5f]">
              Built as a personal project to explore digital voting service
              design.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default Index;

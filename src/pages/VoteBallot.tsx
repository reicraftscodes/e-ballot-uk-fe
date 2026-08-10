import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { votingService, ApiError, type PartyListDto } from "@/config/apiConfig";

import { GovHeader } from "@/components/GovHeader";
import { toast } from "sonner";

import { VOTE_IDENTITY_STORAGE_KEY } from "./Vote";
import { GovFooter } from "@/components/GovFooter";

interface VoteIdentity {
  pollCardReference: string;
  nationalInsuranceNumber: string;
  firstName: string;
  lastName: string;
  dob: string;
}

type PartiesState =
  | { status: "loading" }
  | { status: "error" }
  | {
      status: "ready";
      parties: PartyListDto[];
    };

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

  // Load verified identity from sessionStorage
  useEffect(() => {
    const raw = sessionStorage.getItem(VOTE_IDENTITY_STORAGE_KEY);

    if (!raw) {
      nav("/vote", { replace: true });
      return;
    }

    try {
      const parsed: VoteIdentity = JSON.parse(raw);
      setIdentity(parsed);
    } catch {
      sessionStorage.removeItem(VOTE_IDENTITY_STORAGE_KEY);

      nav("/vote", { replace: true });
    }
  }, [nav]);

  // Load parties
  const loadParties = async () => {
    setPartiesState({ status: "loading" });

    try {
      const { data } = await votingService.getParties();

      setPartiesState({
        status: "ready",
        parties: data,
      });
    } catch {
      setPartiesState({ status: "error" });
    }
  };

  useEffect(() => {
    if (identity) {
      loadParties();
    }
  }, [identity]);

  // Selected party
  const selectedParty =
    partiesState.status === "ready"
      ? partiesState.parties.find((party) => party.id === selectedPartyId)
      : undefined;

  // Open confirmation
  const openConfirm = () => {
    if (!selectedPartyId) {
      toast.error("Select a party to continue");
      return;
    }

    setSubmitError(null);
    setConfirmOpen(true);
  };

  // Cast vote
  const cast = async () => {
    if (!identity || !selectedPartyId) {
      return;
    }

    setBusy(true);
    setSubmitError(null);

    try {
      const { data } = await votingService.castVote({
        nationalInsuranceNumber: identity.nationalInsuranceNumber,
        lastName: identity.lastName,
        partyId: selectedPartyId,
      });

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
        // The backend is authoritative for duplicate votes.
        message = "A vote has already been cast for this voter.";
      }
      setSubmitError(message);
      setConfirmOpen(false);

      toast.error(message);
    } finally {
      setBusy(false);
    }
  };

  // Identity loading
  if (!identity) {
    return null;
  }

  return (
    <div className="min-h-screen bg-white text-[#0b0c0c]">
      <GovHeader />

      <main
        id="main-content"
        className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8"
      >
        <div className="max-w-2xl">
          <button
            type="button"
            onClick={() => nav("/vote")}
            className="
              mb-10
              inline-flex
              items-center
              text-base
              font-medium
              text-[#1d70b8]
              underline
              decoration-2
              underline-offset-2
              hover:text-[#003078]
              focus:outline-none
              focus:ring-4
              focus:ring-[#ffdd00]
            "
          >
            <span aria-hidden="true" className="mr-2 text-xl leading-none">
              ‹
            </span>
            Back
          </button>

          <div className="mb-10">
            <p className="mb-2 text-base text-[#505a5f]">Step 3 of 3</p>

            <h1 className="text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
              Your ballot
            </h1>

            <div className="mt-4 h-2 max-w-xs overflow-hidden bg-[#f3f2f1]">
              <div className="h-full bg-[#00703c]" style={{ width: "100%" }} />
            </div>
          </div>

          {/* VERIFIED IDENTITY*/}

          <div className="mb-8 border-l-4 border-[#00703c] bg-[#f3f2f1] p-5">
            <p className="mb-1 text-sm font-bold uppercase tracking-wide text-[#505a5f]">
              Voting as
            </p>

            <p className="text-xl font-bold">
              {identity.firstName} {identity.lastName}
            </p>

            <p className="mt-1 text-base text-[#505a5f]">
              Your identity has been verified.
            </p>
          </div>

          {submitError && (
            <div
              role="alert"
              className="
                mb-8
                border-l-4
                border-[#d4351c]
                bg-[#f3f2f1]
                p-5
              "
            >
              <h2 className="mb-2 text-xl font-bold">There is a problem</h2>

              <p className="text-base leading-7">{submitError}</p>
            </div>
          )}

          {/* BALLOT*/}
          <section aria-labelledby="choose-party-heading">
            <h2 id="choose-party-heading" className="mb-3 text-2xl font-bold">
              Choose a party
            </h2>

            <p className="mb-8 text-lg leading-7 text-[#505a5f]">
              Select one option. You can review your choice before your vote is
              submitted.
            </p>

            {/* Loading */}
            {partiesState.status === "loading" && (
              <div
                className="border-l-4 border-[#1d70b8] bg-[#f3f2f1] p-5"
                role="status"
                aria-live="polite"
              >
                <p className="font-bold">Loading parties…</p>

                <p className="mt-1 text-base text-[#505a5f]">
                  Please wait while we load the ballot.
                </p>
              </div>
            )}

            {/* Error */}
            {partiesState.status === "error" && (
              <div
                role="alert"
                className="
                  border-l-4
                  border-[#d4351c]
                  bg-[#f3f2f1]
                  p-5
                "
              >
                <h3 className="mb-2 text-xl font-bold">
                  We could not load the ballot
                </h3>

                <p className="mb-5 text-base leading-7">
                  We could not load the list of parties. Try again.
                </p>

                <button
                  type="button"
                  onClick={loadParties}
                  className="
                    inline-flex
                    items-center
                    bg-white
                    px-5
                    py-3
                    text-base
                    font-bold
                    text-[#1d70b8]
                    underline
                    decoration-2
                    underline-offset-2
                    ring-1
                    ring-[#b1b4b6]
                    hover:bg-[#f3f2f1]
                    focus:outline-none
                    focus:ring-4
                    focus:ring-[#ffdd00]
                  "
                >
                  Try again
                </button>
              </div>
            )}

            {/* No parties */}

            {partiesState.status === "ready" &&
              partiesState.parties.length === 0 && (
                <div className="border-l-4 border-[#505a5f] bg-[#f3f2f1] p-5">
                  <p className="font-bold">No parties are available</p>

                  <p className="mt-1 text-base text-[#505a5f]">
                    There are currently no parties available to vote for.
                  </p>
                </div>
              )}

            {/* Party list */}

            {partiesState.status === "ready" &&
              partiesState.parties.length > 0 && (
                <fieldset>
                  <legend className="sr-only">Select a party</legend>

                  <div className="border-t-2 border-[#0b0c0c]">
                    {partiesState.parties.map((party) => {
                      const selected = selectedPartyId === party.id;

                      return (
                        <label
                          key={party.id}
                          htmlFor={`party-${party.id}`}
                          className={`
                            relative
                            flex
                            cursor-pointer
                            items-start
                            gap-4
                            border-b
                            border-[#b1b4b6]
                            px-4
                            py-5
                            transition-colors
                            ${
                              selected
                                ? "bg-[#f3f2f1]"
                                : "bg-white hover:bg-[#f3f2f1]"
                            }
                            focus-within:ring-4
                            focus-within:ring-[#ffdd00]
                          `}
                        >
                          <input
                            id={`party-${party.id}`}
                            type="radio"
                            name="party"
                            value={party.id}
                            checked={selected}
                            onChange={() => setSelectedPartyId(party.id)}
                            className="
                              mt-1
                              h-6
                              w-6
                              shrink-0
                              accent-[#00703c]
                            "
                          />

                          <span className="min-w-0">
                            <span className="block text-lg font-bold">
                              {party.partyName}
                            </span>

                            {party.position && (
                              <span className="mt-1 block text-base leading-6 text-[#505a5f]">
                                {party.position}
                              </span>
                            )}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </fieldset>
              )}

            {/* SELECTED PARTY SUMMARY */}

            {selectedParty && (
              <div className="mt-8 border-l-4 border-[#1d70b8] bg-[#f3f2f1] p-5">
                <p className="text-sm font-bold uppercase tracking-wide text-[#505a5f]">
                  Your selection
                </p>
                <p className="mt-1 text-xl font-bold">
                  {selectedParty.partyName}
                </p>

                {selectedParty.position && (
                  <p className="mt-1 text-base text-[#505a5f]">
                    {selectedParty.position}
                  </p>
                )}
              </div>
            )}

            {/* REVIEW BUTTON */}
            {partiesState.status === "ready" &&
              partiesState.parties.length > 0 && (
                <div className="mt-10">
                  <button
                    type="button"
                    disabled={
                      !selectedPartyId ||
                      busy ||
                      partiesState.status !== "ready"
                    }
                    onClick={openConfirm}
                    className="
                      inline-flex
                      items-center
                      justify-center
                      bg-[#00703c]
                      px-6
                      py-3
                      text-lg
                      font-bold
                      text-white
                      shadow-[0_2px_0_#00401e]
                      hover:bg-[#005a30]
                      disabled:cursor-not-allowed
                      disabled:bg-[#b1b4b6]
                      disabled:text-[#505a5f]
                      disabled:shadow-none
                      focus:outline-none
                      focus:ring-4
                      focus:ring-[#ffdd00]
                    "
                  >
                    Review your vote
                  </button>
                </div>
              )}
          </section>
        </div>
      </main>

      {/* CONFIRMATION */}
      {confirmOpen && (
        <div
          className="
            fixed
            inset-0
            z-50
            flex
            items-center
            justify-center
            bg-black/50
            p-4
          "
          role="presentation"
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-vote-heading"
            className="
              w-full
              max-w-xl
              bg-white
              p-6
              shadow-2xl
              sm:p-8
            "
          >
            <h2 id="confirm-vote-heading" className="mb-5 text-3xl font-bold">
              Confirm your vote
            </h2>

            <div className="mb-8 border-l-4 border-[#1d70b8] bg-[#f3f2f1] p-5">
              <p className="text-base text-[#505a5f]">You are voting for:</p>

              <p className="mt-1 text-2xl font-bold">
                {selectedParty?.partyName}
              </p>

              {selectedParty?.position && (
                <p className="mt-1 text-base text-[#505a5f]">
                  {selectedParty.position}
                </p>
              )}
            </div>

            <p className="mb-8 text-lg leading-7">
              Your vote is final and cannot be changed after it has been
              submitted.
            </p>

            <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
              <button
                type="button"
                disabled={busy}
                onClick={cast}
                className="
                  inline-flex
                  items-center
                  justify-center
                  bg-[#00703c]
                  px-6
                  py-3
                  text-lg
                  font-bold
                  text-white
                  shadow-[0_2px_0_#00401e]
                  hover:bg-[#005a30]
                  disabled:cursor-not-allowed
                  disabled:bg-[#b1b4b6]
                  disabled:text-[#505a5f]
                  disabled:shadow-none
                  focus:outline-none
                  focus:ring-4
                  focus:ring-[#ffdd00]
                "
              >
                {busy ? "Submitting…" : "Confirm and cast vote"}
              </button>

              <button
                type="button"
                disabled={busy}
                onClick={() => setConfirmOpen(false)}
                className="
                  text-lg
                  font-bold
                  text-[#1d70b8]
                  underline
                  decoration-2
                  underline-offset-2
                  hover:text-[#003078]
                  disabled:text-[#505a5f]
                  focus:outline-none
                  focus:ring-4
                  focus:ring-[#ffdd00]
                "
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      <GovFooter />
    </div>
  );
}

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";

import { GovHeader } from "@/components/GovHeader";

export const VOTE_IDENTITY_STORAGE_KEY = "eballot_vote_identity";

function normaliseNi(value: string) {
  return value.replace(/\s+/g, "").toUpperCase();
}

// Step 1: poll card reference + National Insurance number
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

  dob: z
    .string()
    .min(1, "Enter your date of birth")
    .refine(
      (value) => {
        // Native <input type="date"> returns YYYY-MM-DD
        const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);

        if (!match) {
          return false;
        }

        const [, year, month, day] = match;

        const yearNumber = Number(year);
        const monthNumber = Number(month);
        const dayNumber = Number(day);

        // Year must be exactly 4 digits
        if (year.length !== 4) {
          return false;
        }

        // Prevent impossible/future years
        const currentYear = new Date().getFullYear();

        if (yearNumber < 1900 || yearNumber > currentYear) {
          return false;
        }

        // Check that the date actually exists
        const date = new Date(yearNumber, monthNumber - 1, dayNumber);

        if (
          date.getFullYear() !== yearNumber ||
          date.getMonth() !== monthNumber - 1 ||
          date.getDate() !== dayNumber
        ) {
          return false;
        }

        // Date must be in the past
        if (date >= new Date()) {
          return false;
        }

        return true;
      },
      {
        message: "Enter a valid date of birth",
      },
    ),
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
    setAlreadyVoted(false);

    setStep("identity");
  };

  const submitStep2 = () => {
    const parsed = step2Schema.safeParse({
      lastName,
      dob,
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
    runIdentityCheck();
  };

  // Identity confirmation
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

  // Save identity and continue to ballot
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

  // Back navigation
  const goBack = () => {
    if (step === "pollcard-ni") {
      nav("/");
      return;
    }

    setStep("pollcard-ni");
    setFieldErrors({});
    setCheckFailed(false);
  };

  // Progress
  const progress =
    step === "pollcard-ni"
      ? 1
      : step === "identity" || step === "checking"
        ? 2
        : 3;

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
            onClick={goBack}
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
            <p className="mb-2 text-base text-[#505a5f]">
              Step {progress} of 3
            </p>

            <h1 className="text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
              Vote in the UK general election
            </h1>
          </div>

          {/* ALREADY VOTED */}
          {alreadyVoted && (
            <section
              aria-labelledby="already-voted-heading"
              className="
                mb-10
                border-l-4
                border-[#d4351c]
                bg-[#f3f2f1]
                p-6
              "
            >
              <h2
                id="already-voted-heading"
                className="mb-3 text-2xl font-bold"
              >
                You have already voted
              </h2>

              <p className="mb-6 text-base leading-7">
                Our records show that a vote has already been cast for this
                voter. Each voter may only vote once.
              </p>

              <button
                type="button"
                onClick={() => nav("/")}
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
                Back
              </button>
            </section>
          )}

          {!alreadyVoted && step === "pollcard-ni" && (
            <section aria-labelledby="step-one-heading">
              <h2 id="step-one-heading" className="mb-3 text-2xl font-bold">
                Poll card details
              </h2>

              <p className="mb-8 max-w-xl text-lg leading-7 text-[#505a5f]">
                Enter your poll card reference and National Insurance number.
              </p>

              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  submitStep1();
                }}
                noValidate
              >
                <div className="space-y-8">
                  {/* Poll card reference */}
                  <div
                    className={
                      fieldErrors.pollCardReference
                        ? "border-l-4 border-[#d4351c] pl-4"
                        : ""
                    }
                  >
                    <label
                      htmlFor="pollCard"
                      className="mb-2 block text-lg font-bold"
                    >
                      Poll card reference
                    </label>

                    {fieldErrors.pollCardReference && (
                      <p
                        id="pollCard-error"
                        className="mb-2 font-bold text-[#d4351c]"
                      >
                        <span className="sr-only">Error: </span>

                        {fieldErrors.pollCardReference}
                      </p>
                    )}

                    <input
                      id="pollCard"
                      name="pollCardReference"
                      type="text"
                      autoComplete="off"
                      value={pollCardReference}
                      onChange={(event) =>
                        setPollCardReference(event.target.value)
                      }
                      aria-invalid={
                        fieldErrors.pollCardReference ? true : undefined
                      }
                      aria-describedby={
                        fieldErrors.pollCardReference
                          ? "pollCard-error"
                          : undefined
                      }
                      className="
                        block
                        w-full
                        max-w-sm
                        border-2
                        border-[#0b0c0c]
                        bg-white
                        px-3
                        py-2
                        text-lg
                        outline-none
                        focus:border-[#0b0c0c]
                        focus:ring-4
                        focus:ring-[#ffdd00]
                      "
                    />
                  </div>

                  {/* National Insurance number */}
                  <div
                    className={
                      fieldErrors.nationalInsuranceNumber
                        ? "border-l-4 border-[#d4351c] pl-4"
                        : ""
                    }
                  >
                    <label
                      htmlFor="ni"
                      className="mb-2 block text-lg font-bold"
                    >
                      National Insurance number
                    </label>

                    <p className="mb-2 text-base text-[#505a5f]">
                      For example, QQ123456C
                    </p>

                    {fieldErrors.nationalInsuranceNumber && (
                      <p
                        id="ni-error"
                        className="mb-2 font-bold text-[#d4351c]"
                      >
                        <span className="sr-only">Error: </span>

                        {fieldErrors.nationalInsuranceNumber}
                      </p>
                    )}

                    <input
                      id="ni"
                      name="nationalInsuranceNumber"
                      type="text"
                      autoComplete="off"
                      spellCheck={false}
                      value={nationalInsuranceNumber}
                      onChange={(event) =>
                        setNationalInsuranceNumber(event.target.value)
                      }
                      aria-invalid={
                        fieldErrors.nationalInsuranceNumber ? true : undefined
                      }
                      aria-describedby={
                        fieldErrors.nationalInsuranceNumber
                          ? "ni-error"
                          : undefined
                      }
                      className="
                        block
                        w-full
                        max-w-xs
                        border-2
                        border-[#0b0c0c]
                        bg-white
                        px-3
                        py-2
                        text-lg
                        uppercase
                        outline-none
                        focus:border-[#0b0c0c]
                        focus:ring-4
                        focus:ring-[#ffdd00]
                      "
                    />
                  </div>

                  {/* Continue */}
                  <button
                    type="submit"
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
                      focus:outline-none
                      focus:ring-4
                      focus:ring-[#ffdd00]
                    "
                  >
                    Continue
                  </button>
                </div>
              </form>
            </section>
          )}

          {!alreadyVoted && step === "identity" && (
            <section aria-labelledby="identity-heading">
              <h2 id="identity-heading" className="mb-3 text-2xl font-bold">
                Confirm your identity
              </h2>

              <p className="mb-8 max-w-xl text-lg leading-7 text-[#505a5f]">
                Enter your last name and date of birth as shown on the electoral
                register.
              </p>

              {/* Verification failure */}
              {checkFailed && (
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
                  <h3 className="mb-2 text-xl font-bold">There is a problem</h3>

                  <p className="text-base leading-7">
                    We could not confirm those details. Check your last name and
                    date of birth and try again.
                  </p>
                </div>
              )}

              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  submitStep2();
                }}
                noValidate
              >
                <div className="space-y-8">
                  <div
                    className={
                      fieldErrors.lastName
                        ? "border-l-4 border-[#d4351c] pl-4"
                        : ""
                    }
                  >
                    <label
                      htmlFor="lastName"
                      className="mb-2 block text-lg font-bold"
                    >
                      Last name
                    </label>

                    {fieldErrors.lastName && (
                      <p
                        id="lastName-error"
                        className="mb-2 font-bold text-[#d4351c]"
                      >
                        <span className="sr-only">Error: </span>

                        {fieldErrors.lastName}
                      </p>
                    )}

                    <input
                      id="lastName"
                      name="lastName"
                      type="text"
                      autoComplete="family-name"
                      value={lastName}
                      onChange={(event) => setLastName(event.target.value)}
                      aria-invalid={fieldErrors.lastName ? true : undefined}
                      aria-describedby={
                        fieldErrors.lastName ? "lastName-error" : undefined
                      }
                      className="
                        block
                        w-full
                        max-w-sm
                        border-2
                        border-[#0b0c0c]
                        bg-white
                        px-3
                        py-2
                        text-lg
                        outline-none
                        focus:border-[#0b0c0c]
                        focus:ring-4
                        focus:ring-[#ffdd00]
                      "
                    />
                  </div>

                  {/* Date of birth */}
                  <div
                    className={
                      fieldErrors.dob ? "border-l-4 border-[#d4351c] pl-4" : ""
                    }
                  >
                    <label
                      htmlFor="dob"
                      className="mb-2 block text-lg font-bold"
                    >
                      Date of birth
                    </label>

                    <p className="mb-2 text-base text-[#505a5f]">
                      For example, 27 3 1980
                    </p>

                    {fieldErrors.dob && (
                      <p
                        id="dob-error"
                        className="mb-2 font-bold text-[#d4351c]"
                      >
                        <span className="sr-only">Error: </span>

                        {fieldErrors.dob}
                      </p>
                    )}

                    <input
                      id="dob"
                      name="dob"
                      type="date"
                      autoComplete="bday"
                      value={dob}
                      onChange={(event) => setDob(event.target.value)}
                      aria-invalid={fieldErrors.dob ? true : undefined}
                      aria-describedby={
                        fieldErrors.dob ? "dob-error" : undefined
                      }
                      className="
                        block
                        border-2
                        border-[#0b0c0c]
                        bg-white
                        px-3
                        py-2
                        text-lg
                        outline-none
                        focus:border-[#0b0c0c]
                        focus:ring-4
                        focus:ring-[#ffdd00]
                      "
                    />
                  </div>

                  {/* Buttons */}
                  <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
                    <button
                      type="submit"
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
                        focus:outline-none
                        focus:ring-4
                        focus:ring-[#ffdd00]
                      "
                    >
                      Verify identity
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setStep("pollcard-ni");
                        setFieldErrors({});
                        setCheckFailed(false);
                      }}
                      className="
                        inline-flex
                        items-center
                        text-lg
                        font-bold
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
                      Back
                    </button>
                  </div>
                </div>
              </form>
            </section>
          )}

          {/* CHECKING*/}

          {!alreadyVoted && step === "checking" && (
            <section aria-labelledby="checking-heading">
              <h2 id="checking-heading" className="mb-4 text-3xl font-bold">
                Checking your details
              </h2>

              <p className="mb-3 text-lg leading-7">
                We are checking your details. This may take a moment.
              </p>

              <p className="text-base text-[#505a5f]">
                Do not close this page.
              </p>
            </section>
          )}

          {/* CONFIRMED */}

          {!alreadyVoted && step === "confirmed" && (
            <section aria-labelledby="confirmed-heading">
              {/* Confirmation panel */}
              <div
                className="
                  mb-10
                  border-8
                  border-[#00703c]
                  bg-[#00703c]
                  px-6
                  py-8
                  text-white
                "
              >
                <h2 id="confirmed-heading" className="text-3xl font-bold">
                  Identity confirmed
                </h2>
              </div>

              <h2 className="mb-6 text-2xl font-bold">Your details</h2>

              {/* Summary list */}
              <dl
                className="
                  mb-10
                  divide-y
                  divide-[#b1b4b6]
                  border-y
                  border-[#b1b4b6]
                "
              >
                <div className="grid gap-2 py-5 sm:grid-cols-2">
                  <dt className="font-bold">Poll card reference</dt>

                  <dd className="break-words">{pollCardReference}</dd>
                </div>

                <div className="grid gap-2 py-5 sm:grid-cols-2">
                  <dt className="font-bold">National Insurance number</dt>

                  <dd className="break-words">
                    {normaliseNi(nationalInsuranceNumber)}
                  </dd>
                </div>

                <div className="grid gap-2 py-5 sm:grid-cols-2">
                  <dt className="font-bold">Last name</dt>

                  <dd className="break-words">{lastName}</dd>
                </div>

                <div className="grid gap-2 py-5 sm:grid-cols-2">
                  <dt className="font-bold">Date of birth</dt>

                  <dd>{new Date(dob).toLocaleDateString("en-GB")}</dd>
                </div>
              </dl>

              <p className="mb-6 text-lg leading-7">
                Your identity has been confirmed. You can now continue to the
                ballot.
              </p>

              <button
                type="button"
                onClick={goToBallot}
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
                  focus:outline-none
                  focus:ring-4
                  focus:ring-[#ffdd00]
                "
              >
                Continue to vote
              </button>
            </section>
          )}
        </div>
      </main>

      {/* FOOTER */}

      <footer className="mt-16 border-t border-[#b1b4b6] bg-[#f3f2f1]">
        <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 text-sm text-[#505a5f] sm:flex-row sm:items-center sm:justify-between">
            <div>© E-Ballot UK</div>

            <nav
              aria-label="Footer navigation"
              className="flex flex-wrap gap-x-6 gap-y-2"
            >
              <a
                href="#"
                className="
                  text-[#1d70b8]
                  underline
                  hover:text-[#003078]
                  focus:outline-none
                  focus:ring-4
                  focus:ring-[#ffdd00]
                "
              >
                Help
              </a>

              <a
                href="#"
                className="
                  text-[#1d70b8]
                  underline
                  hover:text-[#003078]
                  focus:outline-none
                  focus:ring-4
                  focus:ring-[#ffdd00]
                "
              >
                Accessibility
              </a>

              <a
                href="#"
                className="
                  text-[#1d70b8]
                  underline
                  hover:text-[#003078]
                  focus:outline-none
                  focus:ring-4
                  focus:ring-[#ffdd00]
                "
              >
                Privacy
              </a>
            </nav>
          </div>
        </div>
      </footer>
    </div>
  );
}

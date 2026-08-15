import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { GovHeader } from "@/components/GovHeader";
import { GovFooter } from "@/components/GovFooter";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname,
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <GovHeader />

      <main className="flex-1">
        <div className="w-full max-w-[960px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-8 sm:py-10 lg:py-12">
            <div className="max-w-[660px]">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight text-gray-900 mb-5">
                Page not found
              </h1>

              <p className="text-lg sm:text-xl leading-relaxed text-gray-700 mb-4">
                If you entered a web address, check it is correct.
              </p>

              <p className="text-lg sm:text-xl leading-relaxed text-gray-700 mb-6">
                You can return to the homepage and try again.
              </p>

              <a
                href="/"
                className="
                  inline-block
                  text-lg
                  font-medium
                  text-blue-700
                  underline
                  underline-offset-2
                  hover:text-blue-900
                  focus:outline-none
                  focus:ring-4
                  focus:ring-yellow-400
                  focus:ring-offset-2
                  rounded-sm
                "
              >
                Return to Home
              </a>
            </div>
          </div>
        </div>
      </main>

      <GovFooter />
    </div>
  );
};

export default NotFound;

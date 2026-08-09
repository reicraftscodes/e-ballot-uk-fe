import { Brand } from "./Brand";

export const GovHeader = () => (
  <header className="bg-[#0b0c0c] border-b-[10px] border-[#1d70b8]">
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
      <div className="flex min-h-[64px] items-center">
        <Brand />
      </div>
    </div>
  </header>
);

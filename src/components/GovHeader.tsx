import { Brand } from "./Brand";

export const GovHeader = () => (
  <header className="bg-foreground border-b-[10px] border-accent">
    <div className="max-w-5xl mx-auto px-4 py-2 flex items-center">
      <Brand />
    </div>
  </header>
);

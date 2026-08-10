export const GovFooter = () => {
  return (
    <footer className="mt-16 border-t-[10px] border-[#1d70b8] bg-[#f3f2f1]">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="border-b border-[#b1b4b6] pb-6">
          <p className="text-sm text-[#505a5f]">
            This is a personal project and is not affiliated with or endorsed by
            the UK Government, Electoral Commission, or any local authority.
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
  );
};

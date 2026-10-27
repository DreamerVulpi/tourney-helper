import Logo from "../../../../branding/icons/256.png";

export function ProgramLogo({ theme, collapsed }) {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap');
        .font-super-bold {
          font-family: 'Inter', sans-serif;
          font-weight: 900;
        }
      `}</style>

        <div
            className="
              flex items-center
              gap-[0.4rem]
              mb-2 mt-2
              select-none
              shrink-0
            "
          >
          <div className="p-2 bg-blue-600/10 rounded-lg shrink-0">
            <img
              src={Logo}
              alt="Tourney Helper"
              className="w-6 h-6"
            />
          </div>

          <div
            className={`
              shrink-0
              whitespace-nowrap
              transition-all duration-300
              ${
                collapsed
                  ? "max-w-0 opacity-0"
                  : "max-w-[400px] opacity-100"
              }
            `}
  >
    <span
      className={`font-super-bold italic text-lg tracking-tighter uppercase ${theme.logoTitle}`}
    >
      <span>TOURNEY</span>
      <span className="text-blue-600">HELPER</span>
    </span>
  </div>
</div>
    </>
  );
}
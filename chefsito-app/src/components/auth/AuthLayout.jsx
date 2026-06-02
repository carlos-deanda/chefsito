const FOOD_IMAGE = '/images/hamburger_background.png'

export function ChefsitoLogo() {
  return (
    <div className="relative z-10 select-none">
      <span className="text-4xl font-bold tracking-tight text-white">chefsito</span>
      <svg
        className="-mt-1 ml-1 h-3 w-24 text-white"
        fill="none"
        viewBox="0 0 96 12"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M4 8c12 6 28 6 40 0s28-6 40 0"
          stroke="currentColor"
          strokeLinecap="round"
          strokeWidth="2"
        />
      </svg>
    </div>
  )
}

export default function AuthLayout({ children }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-black p-4 sm:p-6 lg:p-8">
      <div className="relative grid w-full max-w-7xl overflow-hidden rounded-3xl border border-white/15 bg-black shadow-2xl lg:min-h-[680px] lg:grid-cols-2">
        {/* Imagen fantasma: misma foto, más grande y transparente */}
        <img
          alt=""
          aria-hidden
          className="pointer-events-none absolute top-1/2 left-0 z-0 h-[115%] w-[115%] max-w-none -translate-x-[8%] -translate-y-1/2 object-contain object-left opacity-[0.14] blur-[0.5px] sm:h-[125%] sm:w-[125%] lg:opacity-[0.16]"
          src={FOOD_IMAGE}
        />

        <section className="relative z-10 flex flex-col p-6 sm:p-8 lg:p-10">
          <ChefsitoLogo />

          <div className="relative mt-6 flex flex-1 items-center justify-center lg:mt-4">
            <img
              alt="Comida Chefsito"
              className="relative z-10 max-h-56 w-auto object-contain drop-shadow-2xl sm:max-h-80 lg:max-h-[480px]"
              src={FOOD_IMAGE}
            />
          </div>
        </section>

        <section className="relative z-10 flex items-center justify-center p-4 sm:p-6 lg:p-8">
          <div className="w-full max-w-[420px] rounded-2xl border border-white/10 bg-[#141414]/95 px-6 py-8 shadow-xl backdrop-blur-sm sm:px-8 sm:py-10 lg:max-w-[440px]">
            {children}
          </div>
        </section>
      </div>
    </main>
  )
}

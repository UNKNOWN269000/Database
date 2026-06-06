export default function Welcome() {
  return (
    <section className="relative pt-24 pb-8 px-3 sm:px-6 lg:px-8 overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-20 -left-20 h-72 w-72 rounded-full bg-amber-300/30 dark:bg-amber-500/10 blur-3xl"></div>
        <div className="absolute top-40 -right-20 h-96 w-96 rounded-full bg-slate-300/40 dark:bg-slate-700/30 blur-3xl"></div>
        <div className="absolute bottom-20 left-1/3 h-80 w-80 rounded-full bg-amber-200/30 dark:bg-amber-600/10 blur-3xl"></div>

        {/* Subtle grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.04] dark:opacity-[0.06]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(15, 23, 42, 0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(15, 23, 42, 0.4) 1px, transparent 1px)",
            backgroundSize: "50px 50px",
          }}
        ></div>
      </div>

      <div className="mx-auto max-w-5xl">
        {/* Glassmorphism Card */}
        <div className="group relative">
          {/* Glow effect behind the card */}
          <div className="absolute -inset-1 rounded-2xl sm:rounded-3xl bg-gradient-to-r from-amber-400/40 via-amber-500/30 to-amber-600/40 dark:from-amber-500/30 dark:via-amber-400/20 dark:to-amber-500/30 opacity-60 blur-2xl group-hover:opacity-80 transition-opacity duration-500"></div>

          {/* The glass card */}
          <div className="relative rounded-2xl sm:rounded-3xl border border-white/40 dark:border-slate-700/40 bg-white/30 dark:bg-slate-900/30 backdrop-blur-2xl backdrop-saturate-150 shadow-2xl shadow-slate-900/10 dark:shadow-black/40 p-5 sm:p-12 lg:p-16">
            {/* Inner highlight ring */}
            <div className="absolute inset-0 rounded-2xl sm:rounded-3xl ring-1 ring-inset ring-white/30 dark:ring-slate-700/30 pointer-events-none"></div>

            {/* Top decorative bar */}
            <div className="flex items-center gap-2 mb-4 sm:mb-6">
              <div className="flex h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-amber-500 animate-pulse"></div>
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-amber-700 dark:text-amber-400">
                Industrial Dashboard
              </span>
            </div>

            {/* Heading */}
            <h1 className="text-2xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-slate-900 dark:text-white leading-tight">
              Welcome to{" "}
              <span className="bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 dark:from-amber-400 dark:via-amber-500 dark:to-amber-600 bg-clip-text text-transparent">
                Ultra Aluminum
              </span>
            </h1>

            {/* Description */}
            <p className="mt-4 sm:mt-6 text-sm sm:text-xl text-slate-700 dark:text-slate-300 leading-relaxed">
              Securely manage and monitor our manufacturing ecosystem. Access real-time
              inventory levels, production timelines, and comprehensive quality control
              reports through our central industrial database.
            </p>

            {/* Optional small feature pills */}
            <div className="mt-5 sm:mt-8 flex flex-wrap gap-2 sm:gap-3">
              {[
                { label: "Real-time Inventory", icon: "📦" },
                { label: "Production Timelines", icon: "⏱️" },
                { label: "Quality Reports", icon: "📊" },
              ].map((item) => (
                <div
                  key={item.label}
                  className="inline-flex items-center gap-1.5 sm:gap-2 rounded-full border border-white/50 dark:border-slate-700/50 bg-white/40 dark:bg-slate-800/40 backdrop-blur-md px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-200 shadow-sm"
                >
                  <span className="text-sm sm:text-base">{item.icon}</span>
                  <span>{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

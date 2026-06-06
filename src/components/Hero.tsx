export default function Hero() {
  return (
    <section
      id="home"
      className="relative overflow-hidden bg-gradient-to-br from-slate-50 via-white to-amber-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-amber-950/20 pt-32 pb-20 sm:pt-40 sm:pb-28"
    >
      {/* Decorative background elements */}
      <div className="absolute top-20 right-0 h-72 w-72 rounded-full bg-amber-200/20 dark:bg-amber-500/10 blur-3xl"></div>
      <div className="absolute bottom-0 left-0 h-96 w-96 rounded-full bg-slate-200/30 dark:bg-slate-700/20 blur-3xl"></div>

      {/* Grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(15, 23, 42, 0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(15, 23, 42, 0.4) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      ></div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-200 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-500/10 px-4 py-1.5 text-xs font-semibold text-amber-800 dark:text-amber-300">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse"></span>
              ISO 9001:2015 Certified
            </div>

            <h1 className="mt-6 text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-slate-900 dark:text-white leading-tight">
              Precision Engineered
              <span className="block bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 dark:from-amber-400 dark:via-amber-500 dark:to-amber-600 bg-clip-text text-transparent">
                Aluminum Solutions
              </span>
            </h1>

            <p className="mt-6 text-lg text-slate-600 dark:text-slate-300 leading-relaxed max-w-xl">
              Leading manufacturer of premium aluminum profiles, extrusions, and architectural
              systems. Delivering strength, elegance, and innovation to every project since 1998.
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <a
                href="#products"
                className="inline-flex items-center gap-2 rounded-full bg-slate-900 dark:bg-amber-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-900/20 dark:shadow-amber-500/30 hover:bg-amber-600 dark:hover:bg-amber-400 transition-all duration-300"
              >
                Explore Products
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </a>
              <a
                href="#about"
                className="inline-flex items-center gap-2 rounded-full border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-6 py-3 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:border-amber-500 hover:text-amber-700 dark:hover:border-amber-400 dark:hover:text-amber-400 transition-all duration-300"
              >
                Learn More
              </a>
            </div>

            {/* Stats */}
            <div className="mt-12 grid grid-cols-3 gap-6 border-t border-slate-200 dark:border-slate-800 pt-8">
              <div>
                <div className="text-3xl font-bold text-slate-900 dark:text-white">25+</div>
                <div className="text-sm text-slate-500 dark:text-slate-400 mt-1">Years Experience</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-slate-900 dark:text-white">500+</div>
                <div className="text-sm text-slate-500 dark:text-slate-400 mt-1">Projects Done</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-slate-900 dark:text-white">50+</div>
                <div className="text-sm text-slate-500 dark:text-slate-400 mt-1">Product Range</div>
              </div>
            </div>
          </div>

          {/* Right Visual */}
          <div className="relative">
            <div className="relative aspect-square max-w-lg mx-auto">
              {/* Main image card */}
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-slate-800 via-slate-700 to-slate-900 dark:from-slate-700 dark:via-slate-800 dark:to-black shadow-2xl shadow-slate-900/30 dark:shadow-black/50 overflow-hidden">
                {/* Aluminum profile visual */}
                <div className="absolute inset-0 p-8 flex items-center justify-center">
                  <svg viewBox="0 0 200 200" className="w-full h-full">
                    <defs>
                      <linearGradient id="aluBar" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#f1f5f9" />
                        <stop offset="50%" stopColor="#cbd5e1" />
                        <stop offset="100%" stopColor="#64748b" />
                      </linearGradient>
                      <linearGradient id="aluBar2" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#e2e8f0" />
                        <stop offset="50%" stopColor="#94a3b8" />
                        <stop offset="100%" stopColor="#475569" />
                      </linearGradient>
                    </defs>
                    {/* Aluminum profiles arranged artistically */}
                    <rect x="40" y="30" width="120" height="20" rx="2" fill="url(#aluBar)" transform="rotate(-15 100 40)" />
                    <rect x="40" y="70" width="120" height="20" rx="2" fill="url(#aluBar2)" transform="rotate(-5 100 80)" />
                    <rect x="40" y="110" width="120" height="20" rx="2" fill="url(#aluBar)" transform="rotate(8 100 120)" />
                    <rect x="40" y="150" width="120" height="20" rx="2" fill="url(#aluBar2)" transform="rotate(18 100 160)" />
                    {/* Center UA monogram */}
                    <circle cx="100" cy="100" r="32" fill="white" opacity="0.95" />
                    <text x="100" y="115" textAnchor="middle" fontSize="32" fontWeight="800" fill="#0f172a">
                      UA
                    </text>
                  </svg>
                </div>
                {/* Shine overlay */}
                <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/10 to-transparent"></div>
              </div>

              {/* Floating badge 1 */}
              <div className="absolute -top-4 -left-4 rounded-2xl bg-white dark:bg-slate-800 p-4 shadow-xl shadow-slate-900/10 dark:shadow-black/40 ring-1 ring-slate-200/50 dark:ring-slate-700/50">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-500/20">
                    <svg className="h-5 w-5 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">Quality</div>
                    <div className="text-sm font-bold text-slate-900 dark:text-white">Premium Grade</div>
                  </div>
                </div>
              </div>

              {/* Floating badge 2 */}
              <div className="absolute -bottom-4 -right-4 rounded-2xl bg-white dark:bg-slate-800 p-4 shadow-xl shadow-slate-900/10 dark:shadow-black/40 ring-1 ring-slate-200/50 dark:ring-slate-700/50">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-700">
                    <svg className="h-5 w-5 text-slate-700 dark:text-slate-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">Global</div>
                    <div className="text-sm font-bold text-slate-900 dark:text-white">12+ Countries</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

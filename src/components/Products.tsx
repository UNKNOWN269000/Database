const products = [
  {
    name: "Architectural Profiles",
    description: "Premium window, door, and curtain wall profiles for modern architecture.",
    image: (
      <svg viewBox="0 0 200 200" className="w-full h-full">
        <defs>
          <linearGradient id="prod1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#e2e8f0" />
            <stop offset="100%" stopColor="#475569" />
          </linearGradient>
        </defs>
        <rect x="30" y="30" width="50" height="140" rx="3" fill="url(#prod1)" />
        <rect x="90" y="30" width="50" height="140" rx="3" fill="url(#prod1)" opacity="0.7" />
        <rect x="150" y="30" width="20" height="140" rx="2" fill="url(#prod1)" opacity="0.5" />
        <line x1="30" y1="80" x2="80" y2="80" stroke="#1e293b" strokeWidth="1" />
        <line x1="30" y1="120" x2="80" y2="120" stroke="#1e293b" strokeWidth="1" />
      </svg>
    ),
  },
  {
    name: "Industrial Extrusions",
    description: "Custom aluminum extrusions engineered for heavy-duty industrial use.",
    image: (
      <svg viewBox="0 0 200 200" className="w-full h-full">
        <defs>
          <linearGradient id="prod2" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#cbd5e1" />
            <stop offset="100%" stopColor="#334155" />
          </linearGradient>
        </defs>
        <polygon points="100,30 170,100 100,170 30,100" fill="url(#prod2)" />
        <polygon points="100,50 150,100 100,150 50,100" fill="none" stroke="#fbbf24" strokeWidth="2" opacity="0.6" />
        <circle cx="100" cy="100" r="12" fill="#fbbf24" />
      </svg>
    ),
  },
  {
    name: "Heat Sinks",
    description: "High-performance aluminum heat sinks for electronic cooling systems.",
    image: (
      <svg viewBox="0 0 200 200" className="w-full h-full">
        <defs>
          <linearGradient id="prod3" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#f1f5f9" />
            <stop offset="100%" stopColor="#64748b" />
          </linearGradient>
        </defs>
        {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
          <rect key={i} x={20 + i * 20} y="40" width="14" height="120" rx="1" fill="url(#prod3)" />
        ))}
      </svg>
    ),
  },
  {
    name: "Decorative Panels",
    description: "Aesthetic aluminum panels for interior and exterior decoration.",
    image: (
      <svg viewBox="0 0 200 200" className="w-full h-full">
        <defs>
          <linearGradient id="prod4" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#e2e8f0" />
            <stop offset="50%" stopColor="#fbbf24" />
            <stop offset="100%" stopColor="#475569" />
          </linearGradient>
        </defs>
        <rect x="20" y="20" width="160" height="160" rx="8" fill="url(#prod4)" />
        <rect x="40" y="40" width="120" height="120" rx="4" fill="none" stroke="white" strokeWidth="1" opacity="0.5" />
        <circle cx="100" cy="100" r="30" fill="white" opacity="0.3" />
      </svg>
    ),
  },
  {
    name: "Aluminum Sheets",
    description: "Flat sheets and coils in various grades, thicknesses and finishes.",
    image: (
      <svg viewBox="0 0 200 200" className="w-full h-full">
        <defs>
          <linearGradient id="prod5" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#94a3b8" />
            <stop offset="50%" stopColor="#e2e8f0" />
            <stop offset="100%" stopColor="#94a3b8" />
          </linearGradient>
        </defs>
        <rect x="20" y="60" width="160" height="80" rx="3" fill="url(#prod5)" />
        <line x1="20" y1="80" x2="180" y2="80" stroke="#1e293b" strokeWidth="0.5" opacity="0.4" />
        <line x1="20" y1="100" x2="180" y2="100" stroke="#1e293b" strokeWidth="0.5" opacity="0.4" />
        <line x1="20" y1="120" x2="180" y2="120" stroke="#1e293b" strokeWidth="0.5" opacity="0.4" />
      </svg>
    ),
  },
  {
    name: "Custom Fabrication",
    description: "Bespoke aluminum fabrication services to bring your vision to life.",
    image: (
      <svg viewBox="0 0 200 200" className="w-full h-full">
        <defs>
          <linearGradient id="prod6" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#cbd5e1" />
            <stop offset="100%" stopColor="#1e293b" />
          </linearGradient>
        </defs>
        <path d="M 30 170 L 30 80 L 60 50 L 100 50 L 130 80 L 170 80 L 170 170 Z" fill="url(#prod6)" />
        <path d="M 60 50 L 60 30 L 100 30 L 100 50" fill="none" stroke="#fbbf24" strokeWidth="2" />
        <circle cx="100" cy="120" r="14" fill="#fbbf24" opacity="0.8" />
      </svg>
    ),
  },
];

export default function Products() {
  return (
    <section id="products" className="py-20 sm:py-28 bg-slate-50 dark:bg-slate-950">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto text-center">
          <div className="inline-block text-xs font-bold uppercase tracking-widest text-amber-600 dark:text-amber-400">
            Our Products
          </div>
          <h2 className="mt-4 text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-slate-900 dark:text-white">
            Engineered for Excellence
          </h2>
          <p className="mt-6 text-lg text-slate-600 dark:text-slate-300">
            Discover our comprehensive range of aluminum products designed for architectural,
            industrial, and decorative applications.
          </p>
        </div>

        <div className="mt-16 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => (
            <div
              key={product.name}
              className="group rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden hover:border-amber-300 dark:hover:border-amber-500/50 hover:shadow-2xl hover:shadow-slate-900/10 dark:hover:shadow-black/40 transition-all duration-300"
            >
              <div className="aspect-square bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 p-8 group-hover:from-amber-50 group-hover:to-amber-100/50 dark:group-hover:from-amber-500/10 dark:group-hover:to-amber-600/10 transition-colors">
                {product.image}
              </div>
              <div className="p-6">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-amber-700 dark:group-hover:text-amber-400 transition-colors">
                  {product.name}
                </h3>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  {product.description}
                </p>
                <a
                  href="#contact"
                  className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-amber-600 dark:text-amber-400 group-hover:gap-2 transition-all"
                >
                  Learn more
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

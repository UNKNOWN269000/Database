const services = [
  {
    step: "01",
    title: "Consultation",
    description: "We discuss your requirements and provide expert technical guidance.",
  },
  {
    step: "02",
    title: "Design & Engineering",
    description: "Our team creates detailed CAD designs and engineering specifications.",
  },
  {
    step: "03",
    title: "Manufacturing",
    description: "State-of-the-art extrusion and fabrication with strict quality control.",
  },
  {
    step: "04",
    title: "Delivery & Support",
    description: "On-time delivery with comprehensive after-sales support.",
  },
];

export default function Services() {
  return (
    <section id="services" className="py-20 sm:py-28 bg-white dark:bg-slate-900">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16">
          <div>
            <div className="inline-block text-xs font-bold uppercase tracking-widest text-amber-600 dark:text-amber-400">
              Our Process
            </div>
            <h2 className="mt-4 text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-slate-900 dark:text-white">
              From Concept to
              <span className="block text-amber-600 dark:text-amber-400">Completion</span>
            </h2>
            <p className="mt-6 text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
              Our streamlined 4-step process ensures every project is delivered with
              precision, quality, and on schedule. From initial consultation to final
              delivery, we work closely with our clients at every stage.
            </p>

            <div className="mt-10 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 dark:from-amber-600 dark:to-amber-700 p-8 text-white">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-amber-500 dark:bg-white/20">
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold">Industry-Leading Lead Times</h3>
                  <p className="mt-2 text-slate-300 dark:text-amber-50">
                    Our optimized production process delivers orders 30% faster than industry
                    average, without compromising on quality.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {services.map((service) => (
              <div
                key={service.step}
                className="group flex gap-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/50 p-6 hover:border-amber-300 dark:hover:border-amber-500/50 hover:shadow-lg transition-all"
              >
                <div className="flex-shrink-0">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white font-bold group-hover:bg-amber-500 group-hover:text-white transition-colors">
                    {service.step}
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">{service.title}</h3>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                    {service.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

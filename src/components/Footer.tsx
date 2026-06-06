import Logo from "./Logo";

export default function Footer() {
  return (
    <footer className="bg-slate-950 dark:bg-black text-slate-400">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 overflow-hidden rounded-full ring-2 ring-slate-700">
                <Logo />
              </div>
              <div>
                <div className="text-base font-bold text-white">Ultra Aluminum</div>
                <div className="text-xs uppercase tracking-widest text-slate-500">Pvt Ltd</div>
              </div>
            </div>
            <p className="mt-4 text-sm leading-relaxed max-w-md">
              Leading manufacturer of premium aluminum products, profiles, and architectural
              solutions. Delivering excellence in every extrusion since 1998.
            </p>
            <div className="mt-6 flex gap-3">
              {["facebook", "twitter", "linkedin", "instagram"].map((social) => (
                <a
                  key={social}
                  href="#"
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-800 text-slate-400 hover:bg-amber-500 hover:text-white transition-all"
                  aria-label={social}
                >
                  <span className="text-xs font-bold uppercase">
                    {social.charAt(0)}
                  </span>
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-white">
              Quick Links
            </h3>
            <ul className="mt-4 space-y-2.5 text-sm">
              {["About", "Products", "Services", "Contact"].map((item) => (
                <li key={item}>
                  <a
                    href={`#${item.toLowerCase()}`}
                    className="hover:text-amber-400 transition-colors"
                  >
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-white">
              Contact
            </h3>
            <ul className="mt-4 space-y-2.5 text-sm">
              <li>info@ultraaluminum.com</li>
              <li>+91 11 2345 6789</li>
              <li>Industrial Area, Phase II<br />New Delhi, India</li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-slate-500">
            © {new Date().getFullYear()} Ultra Aluminum Pvt Ltd. All rights reserved.
          </p>
          <div className="flex gap-6 text-xs">
            <a href="#" className="hover:text-amber-400 transition-colors">Privacy</a>
            <a href="#" className="hover:text-amber-400 transition-colors">Terms</a>
            <a href="#" className="hover:text-amber-400 transition-colors">Cookies</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

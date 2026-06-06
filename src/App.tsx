import { ThemeProvider } from "./hooks/useTheme";
import Header from "./components/Header";
import Welcome from "./components/Welcome";
import Sections from "./components/Sections";

export default function App() {
  return (
    <ThemeProvider>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-amber-50/40 dark:from-slate-950 dark:via-slate-900 dark:to-amber-950/20 font-sans antialiased text-slate-900 dark:text-slate-100">
        <Header />
        <main>
          <Welcome />
          <Sections />
        </main>
      </div>
    </ThemeProvider>
  );
}

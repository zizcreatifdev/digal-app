import { useEffect, useState } from "react";
import { useParams, Navigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, ChevronLeft, List, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

interface GuideSection {
  id: string;
  titre: string;
  contenu: string;
}

interface GuideData {
  titre: string;
  sections: GuideSection[];
}

export default function DocsPage() {
  const { type } = useParams<{ type: string }>();
  const [guide, setGuide] = useState<GuideData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<string>("");
  const [tocOpen, setTocOpen] = useState(true);

  const guideKey = type === "solo" ? "guide_solo" : type === "agence" ? "guide_agence" : null;

  useEffect(() => {
    if (!guideKey) return;
    (async () => {
      const { data } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", guideKey)
        .maybeSingle();
      if (data?.value) {
        try {
          const parsed = JSON.parse(data.value);
          setGuide(parsed);
          if (parsed.sections?.length) setActiveSection(parsed.sections[0].id);
        } catch { /* empty */ }
      }
      setLoading(false);
    })();
  }, [guideKey]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        }
      },
      { rootMargin: "-20% 0px -60% 0px" }
    );

    if (guide) {
      guide.sections.forEach((s) => {
        const el = document.getElementById(s.id);
        if (el) observer.observe(el);
      });
    }

    return () => observer.disconnect();
  }, [guide]);

  if (!guideKey) return <Navigate to="/" replace />;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!guide) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Ce guide n'a pas encore été rédigé.</p>
      </div>
    );
  }

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b border-border">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/">
              <Button variant="ghost" size="sm">
                <ChevronLeft className="h-4 w-4 mr-1" />
                Accueil
              </Button>
            </Link>
            <span className="text-sm text-muted-foreground hidden sm:inline">|</span>
            <h1 className="text-sm font-semibold font-serif hidden sm:inline">{guide.titre}</h1>
          </div>
          <div className="flex items-center gap-2">
            <Link to={type === "solo" ? "/docs/agence" : "/docs/solo"}>
              <Button variant="outline" size="sm">
                Guide {type === "solo" ? "Agence" : "Solo"}
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setTocOpen(!tocOpen)}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto flex">
        {/* Table of Contents - Sidebar */}
        <aside
          className={`
            ${tocOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
            fixed lg:sticky top-14 left-0 z-40 w-64 h-[calc(100vh-3.5rem)]
            bg-background lg:bg-transparent border-r border-border lg:border-0
            transition-transform lg:transition-none
          `}
        >
          <ScrollArea className="h-full py-6 px-4">
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-sans mb-4">
              Sommaire
            </p>
            <nav className="space-y-1">
              {guide.sections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => {
                    scrollToSection(section.id);
                    if (window.innerWidth < 1024) setTocOpen(false);
                  }}
                  className={`
                    block w-full text-left text-sm px-3 py-2 rounded-md transition-colors font-sans
                    ${activeSection === section.id
                      ? "bg-primary/10 text-primary font-medium"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    }
                  `}
                >
                  {section.titre}
                </button>
              ))}
            </nav>
          </ScrollArea>
        </aside>

        {/* Overlay for mobile TOC */}
        {tocOpen && (
          <div
            className="fixed inset-0 bg-black/30 z-30 lg:hidden"
            onClick={() => setTocOpen(false)}
          />
        )}

        {/* Content */}
        <main className="flex-1 min-w-0 px-4 sm:px-8 py-10 lg:pl-12">
          <div className="max-w-2xl">
            <h1 className="text-3xl font-bold font-serif mb-2 text-foreground">{guide.titre}</h1>
            <p className="text-sm text-muted-foreground font-sans mb-10">
              Guide {type === "solo" ? "Solo" : "Agence"} · Digal
            </p>

            <div className="space-y-12">
              {guide.sections.map((section) => (
                <section key={section.id} id={section.id} className="scroll-mt-20">
                  {section.titre && (
                    <h2 className="text-xl font-semibold font-serif mb-4 text-foreground border-b border-border pb-2">
                      {section.titre}
                    </h2>
                  )}
                  <div className="prose prose-sm max-w-none text-foreground/80 whitespace-pre-wrap font-sans leading-relaxed">
                    {section.contenu}
                  </div>
                </section>
              ))}
            </div>

            <div className="mt-16 pt-6 border-t border-border text-center text-xs text-muted-foreground font-sans">
              Digal · Guide {type === "solo" ? "Solo" : "Agence"} · support@digal.sn
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

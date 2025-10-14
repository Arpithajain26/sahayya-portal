import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import LanguageSelector from "@/components/ui/LanguageSelector";
import { ArrowRight, Shield, Clock, MessageSquare, Globe } from "lucide-react";

export default function Index() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is already logged in
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate("/dashboard");
      }
    });
  }, [navigate]);

  return (
    <>
      {/* Top bar */}
      <div className="px-4 py-6 flex items-center">
        <h1 className="text-2xl font-bold mr-4">{t("welcome")}</h1>
        <LanguageSelector />
      </div>

      {/* Main content */}
      <div className="min-h-screen bg-gradient-hero">
        {/* Hero Section */}
        <header className="container mx-auto px-4 py-6">
          <nav className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="h-8 w-8 text-primary" />
              <span className="text-xl font-bold">{t("portal_name")}</span>
            </div>
            <Button onClick={() => navigate("/auth")}>
              {t("get_started")}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </nav>
        </header>

        <main>
          {/* Hero */}
          <section className="container mx-auto px-4 py-20 text-center">
            <div className="inline-flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-full mb-6">
              <Shield className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-primary">
                {t("trusted_by_students")}
              </span>
            </div>

            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6 max-w-4xl mx-auto">
              {t("hero_title_main")}
              <span className="block bg-gradient-primary bg-clip-text text-transparent mt-2">
                {t("hero_title_highlight")}
              </span>
            </h1>

            <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
              {t("hero_description")}
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" onClick={() => navigate("/auth")}>
                {t("submit_complaint")}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => navigate("/auth")}
              >
                {t("view_complaints")}
              </Button>
            </div>
          </section>

          {/* Features */}
          <section className="container mx-auto px-4 py-20">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                {t("why_choose_platform")}
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                {t("platform_description")}
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-card p-6 rounded-xl border shadow-sm hover:shadow-md transition-shadow">
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Shield className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">
                  {t("secure_private")}
                </h3>
                <p className="text-muted-foreground">
                  {t("secure_private_desc")}
                </p>
              </div>

              <div className="bg-card p-6 rounded-xl border shadow-sm hover:shadow-md transition-shadow">
                <div className="h-12 w-12 rounded-lg bg-success/10 flex items-center justify-center mb-4">
                  <Clock className="h-6 w-6 text-success" />
                </div>
                <h3 className="text-xl font-semibold mb-2">
                  {t("real_time_updates")}
                </h3>
                <p className="text-muted-foreground">
                  {t("real_time_updates_desc")}
                </p>
              </div>

              <div className="bg-card p-6 rounded-xl border shadow-sm hover:shadow-md transition-shadow">
                <div className="h-12 w-12 rounded-lg bg-warning/10 flex items-center justify-center mb-4">
                  <MessageSquare className="h-6 w-6 text-warning" />
                </div>
                <h3 className="text-xl font-semibold mb-2">
                  {t("easy_submission")}
                </h3>
                <p className="text-muted-foreground">
                  {t("easy_submission_desc")}
                </p>
              </div>

              <div className="bg-card p-6 rounded-xl border shadow-sm hover:shadow-md transition-shadow">
                <div className="h-12 w-12 rounded-lg bg-accent/10 flex items-center justify-center mb-4">
                  <Globe className="h-6 w-6 text-accent" />
                </div>
                <h3 className="text-xl font-semibold mb-2">
                  {t("multilingual_support")}
                </h3>
                <p className="text-muted-foreground">
                  {t("multilingual_support_desc")}
                </p>
              </div>
            </div>
          </section>

          {/* Stats */}
          <section className="container mx-auto px-4 py-20">
            <div className="bg-gradient-primary text-primary-foreground rounded-2xl p-12">
              <div className="grid md:grid-cols-3 gap-8 text-center">
                <div>
                  <div className="text-4xl font-bold mb-2">24/7</div>
                  <div className="text-primary-foreground/80">
                    {t("always_available")}
                  </div>
                </div>
                <div>
                  <div className="text-4xl font-bold mb-2">100%</div>
                  <div className="text-primary-foreground/80">
                    {t("secure_encrypted")}
                  </div>
                </div>
                <div>
                  <div className="text-4xl font-bold mb-2">Fast</div>
                  <div className="text-primary-foreground/80">
                    {t("response_times")}
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* CTA */}
          <section className="container mx-auto px-4 py-20 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              {t("cta_title")}
            </h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              {t("cta_desc")}
            </p>
            <Button size="lg" onClick={() => navigate("/auth")}>
              {t("get_started_now")}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </section>
        </main>

        {/* Footer */}
        <footer className="border-t py-8">
          <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
            © 2025 {t("portal_name")}. {t("all_rights_reserved")}
          </div>
        </footer>
      </div>
    </>
  );
}

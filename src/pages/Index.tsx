import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import LanguageSelector from "@/components/ui/LanguageSelector";
import {
  ArrowRight,
  Shield,
  Clock,
  MessageSquare,
  Globe,
  Sparkles,
} from "lucide-react";
import heroImage from "@/assets/hero-campus.jpg";
import { Badge } from "@/components/ui/badge";

export default function Index() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  // Removed auto-redirect - users must click "Get Started" to proceed

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section with Background Image */}
      <section
        className="relative min-h-[90vh] flex items-center justify-center overflow-hidden"
        style={{
          backgroundImage: `linear-gradient(to bottom, rgba(0,0,0,0.6), rgba(0,0,0,0.8)), url(${heroImage})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        {/* Animated Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/30 via-transparent to-accent/30 animate-pulse" />

        {/* Top Navigation */}
        <header className="absolute top-0 left-0 right-0 z-20">
          <nav className="container mx-auto px-4 py-6 flex items-center justify-between">
            <div className="flex items-center gap-2 animate-fade-in">
              <Shield className="h-8 w-8 text-primary animate-pulse" />
              <span className="text-xl font-bold text-white">
                {t("portal_name")}
              </span>
            </div>
            <div className="flex items-center gap-4 animate-fade-in">
              <LanguageSelector />
              <Button
                onClick={() => navigate("/auth")}
                variant="secondary"
                className="gap-2 hover-scale"
              >
                {t("get_started")}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </nav>
        </header>

        {/* Hero Content */}
        <div className="container mx-auto px-4 text-center relative z-10 animate-scale-in">
          <Badge
            variant="secondary"
            className="mb-6 gap-2 px-4 py-2 text-sm backdrop-blur-sm bg-primary/20 border-primary/30 animate-fade-in"
          >
            <Sparkles className="h-4 w-4" />
            {t("trusted_by_students")}
          </Badge>

          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6 max-w-4xl mx-auto text-white animate-fade-in">
            {t("hero_title_main")}
            <span className="block bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent mt-2 animate-pulse">
              {t("hero_title_highlight")}
            </span>
          </h1>

          <p className="text-xl text-gray-200 max-w-2xl mx-auto mb-8 animate-fade-in">
            {t("hero_description")}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in">
            <Button
              size="lg"
              onClick={() => navigate("/auth")}
              className="gap-2 hover-scale shadow-lg"
            >
              {t("submit_complaint")}
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate("/auth")}
              className="gap-2 hover-scale backdrop-blur-sm bg-white/10 border-white/30 text-white hover:bg-white/20"
            >
              {t("view_complaints")}
            </Button>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 border-2 border-white/50 rounded-full flex items-start justify-center p-2">
            <div className="w-1 h-3 bg-white/70 rounded-full" />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-20 bg-gradient-to-b from-background to-muted/20">
        <div className="text-center mb-12 animate-fade-in">
          <Badge variant="outline" className="mb-4">
            Why Choose Us
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            {t("why_choose_platform")}
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {t("platform_description")}
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              icon: Shield,
              title: t("secure_private"),
              desc: t("secure_private_desc"),
              color: "text-primary",
              bgColor: "bg-primary/10",
            },
            {
              icon: Clock,
              title: t("real_time_updates"),
              desc: t("real_time_updates_desc"),
              color: "text-green-500",
              bgColor: "bg-green-500/10",
            },
            {
              icon: MessageSquare,
              title: t("easy_submission"),
              desc: t("easy_submission_desc"),
              color: "text-orange-500",
              bgColor: "bg-orange-500/10",
            },
            {
              icon: Globe,
              title: t("multilingual_support"),
              desc: t("multilingual_support_desc"),
              color: "text-blue-500",
              bgColor: "bg-blue-500/10",
            },
          ].map((feature, index) => (
            <div
              key={index}
              className="bg-card p-6 rounded-xl border shadow-sm hover:shadow-lg transition-all hover-scale animate-fade-in"
              style={{
                animationDelay: `${index * 0.1}s`,
                animationFillMode: "both",
              }}
            >
              <div
                className={`h-12 w-12 rounded-lg ${feature.bgColor} flex items-center justify-center mb-4`}
              >
                <feature.icon className={`h-6 w-6 ${feature.color}`} />
              </div>
              <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Stats Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="bg-gradient-to-r from-primary via-accent to-primary rounded-2xl p-12 text-center shadow-2xl hover-scale animate-fade-in">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="animate-scale-in">
              <div className="text-5xl font-bold mb-2 text-white">24/7</div>
              <div className="text-white/80">{t("always_available")}</div>
            </div>
            <div
              className="animate-scale-in"
              style={{ animationDelay: "0.1s", animationFillMode: "both" }}
            >
              <div className="text-5xl font-bold mb-2 text-white">100%</div>
              <div className="text-white/80">{t("secure_encrypted")}</div>
            </div>
            <div
              className="animate-scale-in"
              style={{ animationDelay: "0.2s", animationFillMode: "both" }}
            >
              <div className="text-5xl font-bold mb-2 text-white">Fast</div>
              <div className="text-white/80">{t("response_times")}</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20 text-center animate-fade-in">
        <h2 className="text-3xl md:text-4xl font-bold mb-6">
          {t("cta_title")}
        </h2>
        <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
          {t("cta_desc")}
        </p>
        <Button
          size="lg"
          onClick={() => navigate("/auth")}
          className="gap-2 hover-scale shadow-lg"
        >
          {t("get_started_now")}
          <ArrowRight className="h-4 w-4" />
        </Button>
      </section>

      {/* Footer */}
      <footer className="border-t py-8 bg-muted/30">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          © 2025 {t("portal_name")}. {t("all_rights_reserved")}
        </div>
      </footer>
    </div>
  );
}

import { Header } from "@/components/landing/header"
import { HeroSection } from "@/components/landing/hero-section"
import { ServicesSection } from "@/components/landing/service-section"
import { PortalSection } from "@/components/landing/portal-section"
import { TechnologySection } from "@/components/landing/technology-section"
import { AboutSection } from "@/components/landing/about-section"
import { Footer } from "@/components/landing/footer"

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <Header />
      <HeroSection />
      <ServicesSection />
      <PortalSection />
      <TechnologySection />
      <AboutSection />
      <Footer />
    </div>
  )
}

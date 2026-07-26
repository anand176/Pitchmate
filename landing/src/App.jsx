import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import Features from "./components/Features";
import HowItWorks from "./components/HowItWorks";
import Coverage from "./components/Coverage";
import CTASection from "./components/CTASection";
import Footer from "./components/Footer";

export default function App() {
    return (
        <>
            <div className="bg-ambience" aria-hidden="true">
                <div className="mesh mesh--accent" />
                <div className="mesh mesh--secondary" />
                <div className="mesh mesh--tertiary" />
            </div>
            <Navbar />
            <main>
                <Hero />
                <Features />
                <HowItWorks />
                <Coverage />
                <CTASection />
            </main>
            <Footer />
        </>
    );
}

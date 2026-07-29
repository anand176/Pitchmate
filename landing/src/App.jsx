import { motion, useReducedMotion } from "framer-motion";
import Splash from "./components/Splash";
import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import Features from "./components/Features";
import HowItWorks from "./components/HowItWorks";
import Coverage from "./components/Coverage";
import CTASection from "./components/CTASection";
import Footer from "./components/Footer";

export default function App() {
    const reduceMotion = useReducedMotion();

    return (
        <>
            <Splash />
            <div className="bg-ambience" aria-hidden="true">
                <motion.div
                    className="mesh mesh--accent"
                    animate={
                        reduceMotion
                            ? undefined
                            : { x: [0, 40, 0], y: [0, 30, 0], scale: [1, 1.08, 1] }
                    }
                    transition={{ duration: 26, repeat: Infinity, ease: "easeInOut" }}
                />
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

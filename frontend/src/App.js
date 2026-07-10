import React from "react";
import "./App.css";
import "./styles/futuristic-transitions.css";
import "./styles/mobile-overlays.css";
import { BrowserRouter } from "react-router-dom";
import { LanguageProvider } from "./contexts/LanguageContext";
import { AppOpenTransitionProvider } from "./contexts/AppOpenTransitionContext";
import Header from "./components/Header";
import Footer from "./components/Footer";
import AnimatedRoutes from "./components/AnimatedRoutes";
import SiteBackground from "./components/SiteBackground";
import AnnouncementPopup from "./components/AnnouncementPopup";
import SplashScreen from "./components/SplashScreen";
import RoboAssistant from "./components/RoboAssistant";
import BodyScrollGuard from "./components/BodyScrollGuard";
import "./styles/robo-assistant.css";

function App() {
  return (
    <LanguageProvider>
      <BrowserRouter>
        <BodyScrollGuard />
        <AppOpenTransitionProvider>
          <SplashScreen />
          <div className="App min-h-screen flex flex-col relative">
            <SiteBackground />
            <AnnouncementPopup />
            <Header />
            <main className="flex-1 overflow-x-hidden">
              <AnimatedRoutes />
            </main>
            <Footer />
            <RoboAssistant />
          </div>
        </AppOpenTransitionProvider>
      </BrowserRouter>
    </LanguageProvider>
  );
}

export default App;

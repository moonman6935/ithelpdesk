import React from "react";
import "./App.css";
import "./styles/futuristic-transitions.css";
import { BrowserRouter } from "react-router-dom";
import { LanguageProvider } from "./contexts/LanguageContext";
import { AppOpenTransitionProvider } from "./contexts/AppOpenTransitionContext";
import Header from "./components/Header";
import Footer from "./components/Footer";
import AnimatedRoutes from "./components/AnimatedRoutes";
import SiteBackground from "./components/SiteBackground";
import AnnouncementPopup from "./components/AnnouncementPopup";

function App() {
  return (
    <LanguageProvider>
      <BrowserRouter>
        <AppOpenTransitionProvider>
          <div className="App min-h-screen flex flex-col relative">
            <SiteBackground />
            <AnnouncementPopup />
            <Header />
            <main className="flex-1 overflow-x-hidden">
              <AnimatedRoutes />
            </main>
            <Footer />
          </div>
        </AppOpenTransitionProvider>
      </BrowserRouter>
    </LanguageProvider>
  );
}

export default App;

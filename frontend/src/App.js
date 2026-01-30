import React from "react";
import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LanguageProvider } from "./contexts/LanguageContext";
import Header from "./components/Header";
import Footer from "./components/Footer";
import Home from "./pages/Home";
import PCSetup from "./pages/PCSetup";
import HeadsetTest from "./pages/HeadsetTest";
import Troubleshooting from "./pages/Troubleshooting";
import AssetConfirmation from "./pages/AssetConfirmation";
import AdminDashboard from "./pages/AdminDashboard";
import LoginPage from "./pages/LoginPage";

function App() {
  return (
    <LanguageProvider>
      <BrowserRouter>
        <div className="App min-h-screen flex flex-col">
          <Header />
          <main className="flex-1">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/pc-setup" element={<PCSetup />} />
              <Route path="/headset-test" element={<HeadsetTest />} />
              <Route path="/troubleshooting" element={<Troubleshooting />} />
              <Route path="/asset-confirmation" element={<AssetConfirmation />} />
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/login" element={<LoginPage />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </BrowserRouter>
    </LanguageProvider>
  );
}

export default App;

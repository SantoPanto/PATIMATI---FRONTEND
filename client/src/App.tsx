import "./App.css";

import { Route, Switch } from "wouter";

import HomePage from "./pages/HomePage";
import ListingsPage from "./pages/ListingsPage";
import AddListingPage from "./pages/AddListingPage";
import MapPage from "./pages/MapPage";
import ProfilePage from "./pages/ProfilePage";
import PetDetailPage from "./pages/PetDetailPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ChangePasswordPage from "./pages/ChangePasswordPage";
import ChatPage from "./pages/ChatPage";
import NotFound from "./pages/NotFound";
import Adoption from "./pages/Adoption";
import SettingsPage from "./pages/SettingsPage";
import AdoptionDetailPage from "./pages/AdoptionDetailPage";
import FavoritesPage from "./pages/FavoritesPage";
import AiMatchPage from "./pages/AiMatchPage";
import AiMatchResultsPage from "./pages/AiMatchResultsPage";
import AdoptionCreatePage from "./pages/AdoptionCreatePage";
import FoundPetCreatePage from "./pages/FoundPetCreatePage";
import AboutPage from "./pages/AboutPage";
import SafetyPage from "./pages/SafetyPage";
import ErrorBoundary from "./components/ErrorBoundary";

function App() {
  return (
    <ErrorBoundary title="Uygulama yüklenirken bir sorun oluştu.">
      <Switch>
        {/* Ana Sayfa */}
        <Route path="/" component={HomePage} />

        {/* Giriş / Kayıt */}
        <Route path="/login" component={LoginPage} />
        <Route path="/register" component={RegisterPage} />

        <Route
          path="/forgot-password"
          component={ForgotPasswordPage}
        />

        <Route
          path="/change-password"
          component={ChangePasswordPage}
        />

        {/* İlanlar */}
        <Route path="/listings" component={ListingsPage} />
        <Route path="/add-listing" component={AddListingPage} />
        <Route path="/pet/:id" component={PetDetailPage} />

        {/* Buldum İlanı */}
        <Route
          path="/found/create"
          component={FoundPetCreatePage}
        />
        <Route path="/about" component={AboutPage} />
        <Route path="/safety" component={SafetyPage} />

        {/* Harita / Mesaj */}
        <Route path="/map" component={MapPage} />
        <Route path="/chat" component={ChatPage} />

        {/* Kullanıcı */}
        <Route path="/profile" component={ProfilePage} />
        <Route path="/settings" component={SettingsPage} />
        <Route path="/favorites" component={FavoritesPage} />

        {/* Sahiplendirme */}
        <Route
          path="/adoption/create"
          component={AdoptionCreatePage}
        />

        <Route
          path="/adoption/:id"
          component={AdoptionDetailPage}
        />

        <Route path="/adoption" component={Adoption} />

        {/* Yapay Zeka */}
        <Route
          path="/ai-match/results"
          component={AiMatchResultsPage}
        />

        <Route
          path="/ai-match"
          component={AiMatchPage}
        />

        {/* 404 */}
        <Route component={NotFound} />
      </Switch>
    </ErrorBoundary>
  );
}

export default App;
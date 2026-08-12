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
import RequireAuth from "./components/RequireAuth";
//import ChatDetailPage from "./pages/ChatDetailPage";
import AdminDashboardPage from "./pages/AdminDashboardPage";
import AdminComplaintsPage from "./pages/AdminComplaintsPage";
import AdminListingsPage from "./pages/AdminListingsPage";
import AdminUsersPage from "./pages/AdminUsersPage";
import UnauthorizedPage from "./pages/UnauthorizedPage";

function ProtectedAddListingPage() {
  return (
    <RequireAuth
      component={AddListingPage}
      fallbackPath="/listings"
    />
  );
}

function ProtectedFoundPetCreatePage() {
  return (
    <RequireAuth
      component={FoundPetCreatePage}
      fallbackPath="/listings"
    />
  );
}

function ProtectedChatPage() {
  return <RequireAuth component={ChatPage} fallbackPath="/" />;
}

function ProtectedAdoptionCreatePage() {
  return (
    <RequireAuth
      component={AdoptionCreatePage}
      fallbackPath="/adoption"
    />
  );
}

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
        <Route
          path="/add-listing"
          component={ProtectedAddListingPage}
        />
        <Route path="/pet/:id" component={PetDetailPage} />

        {/* Buldum İlanı */}
        <Route
          path="/found/create"
          component={ProtectedFoundPetCreatePage}
        />
        <Route path="/about" component={AboutPage} />
        <Route path="/safety" component={SafetyPage} />

        {/* Harita / Mesaj */}
        <Route path="/map" component={MapPage} />
        <Route path="/chat" component={ProtectedChatPage} />

        {/* Kullanıcı */}
        <Route path="/profile" component={ProfilePage} />
        <Route path="/settings" component={SettingsPage} />
        <Route path="/favorites" component={FavoritesPage} />
        {/* Sahiplendirme */}
        <Route
          path="/adoption/create"
          component={ProtectedAdoptionCreatePage}
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
        {/* Admin */}
        <Route path="/admin" component={AdminDashboardPage} />
        <Route
          path="/admin/complaints"
          component={AdminComplaintsPage}
        />
        <Route
          path="/admin/listings"
          component={AdminListingsPage}
        />
        <Route path="/admin/users" component={AdminUsersPage} />

        {/* Unauthorized */}
        <Route
          path="/unauthorized"
          component={UnauthorizedPage}
        />
        {/* 404 */}
        <Route component={NotFound} />
      </Switch>
    </ErrorBoundary>
  );
}

export default App;
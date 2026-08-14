import "./App.css";

import { Route, Switch } from "wouter";

import HomePage from "./pages/HomePage";
import ListingsPage from "./pages/listingpage";
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
import MyListingsPage from "./pages/MyListingsPage";
import AiMatchPage from "./pages/AiMatchPage";
import AiMatchResultsPage from "./pages/AiMatchResultsPage";
import AdoptionCreatePage from "./pages/AdoptionCreatePage";
import FoundPetCreatePage from "./pages/FoundPetCreatePage";
import AboutPage from "./pages/AboutPage";
import SafetyPage from "./pages/SafetyPage";
import ErrorBoundary from "./components/ErrorBoundary";
import RequireAuth from "./components/RequireAuth";
import RequireGuest from "./components/RequireGuest";
import ChatDetailPage from "./pages/ChatDetailPage";
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

function ProtectedChatDetailPage() {
  return <RequireAuth component={ChatDetailPage} fallbackPath="/adoption" />;
}

function ProtectedAdoptionCreatePage() {
  return (
    <RequireAuth
      component={AdoptionCreatePage}
      fallbackPath="/adoption"
    />
  );
}

function ProtectedProfilePage() {
  return <RequireAuth component={ProfilePage} mode="redirect" />;
}

function ProtectedMyListingsPage() {
  return <RequireAuth component={MyListingsPage} mode="redirect" />;
}

function ProtectedSettingsPage() {
  return <RequireAuth component={SettingsPage} mode="redirect" />;
}

function ProtectedFavoritesPage() {
  return <RequireAuth component={FavoritesPage} mode="redirect" />;
}

function ProtectedChangePasswordPage() {
  return <RequireAuth component={ChangePasswordPage} mode="redirect" />;
}

function ProtectedAdminDashboardPage() {
  return <RequireAuth component={AdminDashboardPage} mode="redirect" />;
}

function ProtectedAdminComplaintsPage() {
  return <RequireAuth component={AdminComplaintsPage} mode="redirect" />;
}

function ProtectedAdminListingsPage() {
  return <RequireAuth component={AdminListingsPage} mode="redirect" />;
}

function ProtectedAdminUsersPage() {
  return <RequireAuth component={AdminUsersPage} mode="redirect" />;
}

function GuestLoginPage() {
  return <RequireGuest component={LoginPage} />;
}

function GuestRegisterPage() {
  return <RequireGuest component={RegisterPage} />;
}

function GuestForgotPasswordPage() {
  return <RequireGuest component={ForgotPasswordPage} />;
}

function App() {
  return (
    <ErrorBoundary title="Uygulama yüklenirken bir sorun oluştu.">
      <Switch>
        {/* Ana Sayfa */}
        <Route path="/" component={HomePage} />

        {/* Giriş / Kayıt */}
        <Route path="/login" component={GuestLoginPage} />
        <Route path="/register" component={GuestRegisterPage} />

        <Route
          path="/forgot-password"
          component={GuestForgotPasswordPage}
        />

        <Route
          path="/change-password"
          component={ProtectedChangePasswordPage}
        />

        {/* İlanlar */}
        <Route path="/listings" component={ListingsPage} />
        <Route
          path="/add-listing"
          component={ProtectedAddListingPage}
        />
        <Route path="/pet/:id" component={PetDetailPage} />
        <Route path="/ads/:id" component={PetDetailPage} />

        {/* Buldum İlanı */}
        <Route
          path="/found/create"
          component={ProtectedFoundPetCreatePage}
        />
        <Route path="/about" component={AboutPage} />
        <Route path="/safety" component={SafetyPage} />

        {/* Harita / Mesaj */}
        <Route path="/map" component={MapPage} />
        <Route path="/chat/:userId" component={ProtectedChatDetailPage} />
        <Route path="/chat" component={ProtectedChatPage} />

        {/* Kullanıcı */}
        <Route path="/profile/listings" component={ProtectedMyListingsPage} />
        <Route path="/profile" component={ProtectedProfilePage} />
        <Route path="/settings" component={ProtectedSettingsPage} />
        <Route path="/favorites" component={ProtectedFavoritesPage} />
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
        <Route path="/admin" component={ProtectedAdminDashboardPage} />
        <Route
          path="/admin/complaints"
          component={ProtectedAdminComplaintsPage}
        />
        <Route
          path="/admin/listings"
          component={ProtectedAdminListingsPage}
        />
        <Route path="/admin/users" component={ProtectedAdminUsersPage} />

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

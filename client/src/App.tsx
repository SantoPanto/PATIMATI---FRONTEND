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
import ResetPasswordPage from "./pages/ResetPasswordPage";
import ChangePasswordPage from "./pages/ChangePasswordPage";
import ChatPage from "./pages/ChatPage";
import AiMatchPage from "./pages/AiMatchPage";
import AiMatchResultsPage from "./pages/AiMatchResultsPage";
import BenNeyimPage from "./pages/BenNeyimPage";
import NotFound from "./pages/NotFound";
import Adoption from "./pages/Adoption";
import SettingsPage from "./pages/SettingsPage";
import FavoritesPage from "./pages/FavoritesPage";
import MyListingsPage from "./pages/MyListingsPage";
import MyMatchesPage from "./pages/MyMatchesPage";
import PotentialMatchesPage from "./pages/PotentialMatchesPage";
import AdoptionCreatePage from "./pages/AdoptionCreatePage";
import FoundPetCreatePage from "./pages/FoundPetCreatePage";
import AboutPage from "./pages/AboutPage";
import PublicReportPage from "./pages/PublicReportPage";
import MunicipalityReportQueuePage from "./pages/MunicipalityReportQueuePage"; 
import SafetyPage from "./pages/SafetyPage";
import GizlilikPage from "./pages/GizlilikPage";
import ErrorBoundary from "./components/ErrorBoundary";
import RequireAuth from "./components/RequireAuth";
import RequireGuest from "./components/RequireGuest";
import ChatDetailPage from "./pages/ChatDetailPage";
import AdminDashboardPage from "./pages/AdminDashboardPage";
import AdminComplaintsPage from "./pages/AdminComplaintsPage";
import AdminListingsPage from "./pages/AdminListingsPage";
import AdminUsersPage from "./pages/AdminUsersPage";
import UnauthorizedPage from "./pages/UnauthorizedPage";
import NotificationsPage from "./pages/NotificationsPage";
import ComplaintPage from "./pages/ComplaintPage";
import OAuthRedirectHandler from "./pages/OAuthRedirectHandler";
import ForegroundNotificationToast from "./components/ForegroundNotificationToast";
import BottomNav from "./components/BottomNav";
import ScrollToTop from "./components/ScrollToTop";

function ProtectedAddListingPage() {
  return <RequireAuth component={AddListingPage} mode="redirect" />;
}

function ProtectedFoundPetCreatePage() {
  return <RequireAuth component={FoundPetCreatePage} mode="redirect" />;
}

function ProtectedChatPage() {
  return <RequireAuth component={ChatPage} mode="redirect" />;
}

function ProtectedChatDetailPage() {
  return (
    <RequireAuth
      component={ChatDetailPage}
      fallbackPath="/adoption"
      mode="modal"
    />
  );
}

function ProtectedAdoptionCreatePage() {
  return <RequireAuth component={AdoptionCreatePage} mode="redirect" />;
}

function ProtectedBenNeyimPage() {
  return <RequireAuth component={BenNeyimPage} mode="redirect" />;
}

function ProtectedProfilePage() {
  return <RequireAuth component={ProfilePage} mode="redirect" />;
}

function ProtectedMyListingsPage() {
  return <RequireAuth component={MyListingsPage} mode="redirect" />;
}

function ProtectedMyMatchesPage() {
  return <RequireAuth component={MyMatchesPage} mode="redirect" />;
}

function ProtectedPotentialMatchesPage() {
  return <RequireAuth component={PotentialMatchesPage} mode="redirect" />;
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
  return (
    <RequireAuth component={AdminDashboardPage} mode="redirect" requiredRole="ADMIN" />
  );
}

function ProtectedAdminComplaintsPage() {
  return (
    <RequireAuth component={AdminComplaintsPage} mode="redirect" requiredRole="ADMIN" />
  );
}

function ProtectedAdminListingsPage() {
  return (
    <RequireAuth component={AdminListingsPage} mode="redirect" requiredRole="ADMIN" />
  );
}

function ProtectedAdminUsersPage() {
  return (
    <RequireAuth component={AdminUsersPage} mode="redirect" requiredRole="ADMIN" />
  );
}

function ProtectedNotificationsPage() {
  return <RequireAuth component={NotificationsPage} mode="redirect" />;
}

function ProtectedComplaintPage() {
  return <RequireAuth component={ComplaintPage} mode="redirect" />;
}

function ProtectedMunicipalityReportQueuePage() {
  return <RequireAuth component={MunicipalityReportQueuePage} mode="redirect" requiredRole="ADMIN" />;
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

function GuestResetPasswordPage() {
  return <RequireGuest component={ResetPasswordPage} />;
}

function App() {
  return (
    <ErrorBoundary title="Uygulama yüklenirken bir sorun oluştu.">
      <ScrollToTop />
      <ForegroundNotificationToast />
      <Switch>
        {/* Ana Sayfa */}
        <Route path="/" component={HomePage} />

        {/* Giriş / Kayıt */}
        <Route path="/login" component={GuestLoginPage} />
        <Route path="/oauth-redirect" component={OAuthRedirectHandler} />
        <Route path="/register" component={GuestRegisterPage} />

        <Route
          path="/forgot-password"
          component={GuestForgotPasswordPage}
        />

        <Route
          path="/reset-password"
          component={GuestResetPasswordPage}
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
        <Route
          path="/lost/create"
          component={ProtectedAddListingPage}
        />
        <Route path="/pet/:id" component={PetDetailPage} />
        <Route path="/ads/:id" component={PetDetailPage} />

        {/* AI Eşleşme */}
        <Route path="/ai-match" component={AiMatchPage} />
        <Route path="/ai-match-results" component={AiMatchResultsPage} />

        {/* Ben Neyim? */}
        <Route path="/ben-neyim" component={ProtectedBenNeyimPage} />

        {/* Buldum İlanı */}
        <Route
          path="/found/create"
          component={ProtectedFoundPetCreatePage}
        />
        <Route path="/about" component={AboutPage} />
        <Route path="/safety" component={SafetyPage} />
        <Route path="/privacy" component={GizlilikPage} />

        {/* Halka Açık İhbar Formu */}
        <Route path="/report" component={PublicReportPage} />

        {/* Belediye Paneli Kuyruk Sayfası (Korumalı) */}
        <Route path="/municipality/queue" component={ProtectedMunicipalityReportQueuePage} />

        {/* Harita / Mesaj */}
        <Route path="/map" component={MapPage} />
        <Route path="/chat/:userId" component={ProtectedChatDetailPage} />
        <Route path="/chat" component={ProtectedChatPage} />

        {/* Kullanıcı */}
        <Route path="/my-matches" component={ProtectedMyMatchesPage} />
        <Route
          path="/potential-matches"
          component={ProtectedPotentialMatchesPage}
        />
        <Route path="/profile/listings" component={ProtectedMyListingsPage} />
        <Route path="/profile" component={ProtectedProfilePage} />
        <Route path="/settings" component={ProtectedSettingsPage} />
        <Route path="/favorites" component={ProtectedFavoritesPage} />
        <Route
          path="/notifications"
          component={ProtectedNotificationsPage}
        />
        <Route path="/complaints" component={ProtectedComplaintPage} />
        
        {/* Sahiplendirme */}
        <Route
          path="/adopt/create"
          component={ProtectedAdoptionCreatePage}
        />
        <Route
          path="/adoption/create"
          component={ProtectedAdoptionCreatePage}
        />

        <Route
          path="/adoption/:id"
          component={PetDetailPage}
        />

        <Route path="/adoption" component={Adoption} />

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
      <BottomNav />
    </ErrorBoundary>
  );
}

export default App;
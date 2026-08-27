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
import HelpCreatePage from "./pages/HelpCreatePage";
import FoundPetCreatePage from "./pages/FoundPetCreatePage";
import AboutPage from "./pages/AboutPage";
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
import ServicesPage from "./pages/ServicesPage";
import BusinessApplicationFormPage from "./pages/BusinessApplicationFormPage";
import VetDirectoryPage from "./pages/VetDirectoryPage";
import VetDetailPage from "./pages/VetDetailPage";
import VetPanelPage from "./pages/VetPanelPage";
import PetShopDirectoryPage from "./pages/PetShopDirectoryPage";
import PetShopDetailPage from "./pages/PetShopDetailPage";
import PetShopProductDetailPage from "./pages/PetShopProductDetailPage";
import PetShopProductsPage from "./pages/PetShopProductsPage";
import PetShopPanelPage from "./pages/PetShopPanelPage";
import ShelterDirectoryPage from "./pages/ShelterDirectoryPage";
import ShelterDetailPage from "./pages/ShelterDetailPage";
import ShelterAdoptionsPage from "./pages/ShelterAdoptionsPage";
import ShelterPanelPage from "./pages/ShelterPanelPage";
import MyPetsPage from "./pages/MyPetsPage";
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

function ProtectedHelpCreatePage() {
  return <RequireAuth component={HelpCreatePage} mode="redirect" />;
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

function ProtectedVetPanelPage() {
  return (
    <RequireAuth component={VetPanelPage} mode="redirect" requiredRole="VET" />
  );
}

function ProtectedPetShopPanelPage() {
  return (
    <RequireAuth component={PetShopPanelPage} mode="redirect" requiredRole="PETSHOP" />
  );
}

function ProtectedShelterPanelPage() {
  return (
    <RequireAuth component={ShelterPanelPage} mode="redirect" requiredRole="BARINAK" />
  );
}

function ProtectedBusinessApplicationFormPage() {
  return <RequireAuth component={BusinessApplicationFormPage} mode="redirect" />;
}

function ProtectedMyPetsPage() {
  return <RequireAuth component={MyPetsPage} mode="redirect" />;
}

function ProtectedNotificationsPage() {
  return <RequireAuth component={NotificationsPage} mode="redirect" />;
}

function ProtectedComplaintPage() {
  return <RequireAuth component={ComplaintPage} mode="redirect" />;
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

        {/* Ben Neyim? -- yalnızca kayıtlı kullanıcılar (bkz. sayfaya doğrudan
            gidiliyor olması: ProtectedAdoptionCreatePage/profile ile AYNI
            "redirect" deseni) */}
        <Route path="/ben-neyim" component={ProtectedBenNeyimPage} />

        {/* Buldum İlanı */}
        <Route
          path="/found/create"
          component={ProtectedFoundPetCreatePage}
        />
        <Route path="/about" component={AboutPage} />
        <Route path="/safety" component={SafetyPage} />
        <Route path="/privacy" component={GizlilikPage} />

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

        {/* Yardım (yardıma muhtaç hayvanlar) */}
        <Route path="/help/create" component={ProtectedHelpCreatePage} />

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

        {/* Hizmetler -- Tümü/Veteriner/Petshop/Barınak filtreli toplu sayfa
            (Header'daki "Hizmetler" ikonu artık üç seçenekli bir açılır menü
            değil, doğrudan buraya götürüyor). */}
        <Route path="/hizmetler" component={ServicesPage} />
        <Route
          path="/hizmetler/isletme-basvurusu"
          component={ProtectedBusinessApplicationFormPage}
        />

        {/* Hizmetler / Veteriner */}
        <Route path="/hizmetler/veteriner/:id" component={VetDetailPage} />
        <Route path="/hizmetler/veteriner" component={VetDirectoryPage} />
        <Route path="/vet/panel" component={ProtectedVetPanelPage} />
        <Route path="/profile/pets" component={ProtectedMyPetsPage} />

        {/* Hizmetler / Petshop -- :shopId/urun/:productId rotası :id
            rotasından ÖNCE gelmeli (wouter tanımlama sırasına göre
            eşleştiriyor -- veteriner/:id ile aynı gerekçe, plan §13) */}
        <Route
          path="/hizmetler/petshop/:shopId/urun/:productId"
          component={PetShopProductDetailPage}
        />
        <Route path="/hizmetler/petshop/:id/urunler" component={PetShopProductsPage} />
        <Route path="/hizmetler/petshop/:id" component={PetShopDetailPage} />
        <Route path="/hizmetler/petshop" component={PetShopDirectoryPage} />
        <Route path="/petshop/panel" component={ProtectedPetShopPanelPage} />

        {/* Hizmetler / Barınak -- Petshop'taki gibi iç içe bir
            :shopId/urun/:productId rotası GEREKMİYOR, ilanlar kendi mevcut
            detay rotasını (/adoption/{id}) kullanıyor (plan §17). */}
        <Route path="/hizmetler/barinak/:id/ilanlar" component={ShelterAdoptionsPage} />
        <Route path="/hizmetler/barinak/:id" component={ShelterDetailPage} />
        <Route path="/hizmetler/barinak" component={ShelterDirectoryPage} />
        <Route path="/barinak/panel" component={ProtectedShelterPanelPage} />

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

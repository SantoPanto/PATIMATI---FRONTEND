import { Route, Switch } from "wouter";
import AddListingPage from "./pages/AddListingPage";
import AdminComplaintsPage from "./pages/AdminComplaintsPage";
import AdminDashboardPage from "./pages/AdminDashboardPage";
import AdminListingsPage from "./pages/AdminListingsPage";
import AdminUsersPage from "./pages/AdminUsersPage";
import ChatPage from "./pages/ChatPage";
import ComplaintPage from "./pages/ComplaintPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import HomePage from "./pages/HomePage";
import ListingsPage from "./pages/ListingsPage";
import LoginPage from "./pages/LoginPage";
import MapPage from "./pages/MapPage";
import NotificationsPage from "./pages/NotificationsPage";
import NotFound from "./pages/NotFound";
import PetDetailPage from "./pages/PetDetailPage";
import ProfilePage from "./pages/ProfilePage";
import RegisterPage from "./pages/RegisterPage";
import UnauthorizedPage from "./pages/UnauthorizedPage";

export default function App() {
  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/login" component={LoginPage} />
      <Route path="/register" component={RegisterPage} />
      <Route path="/forgot-password" component={ForgotPasswordPage} />
      <Route path="/add-listing" component={AddListingPage} />
      <Route path="/listings" component={ListingsPage} />
      <Route path="/pet/:id" component={PetDetailPage} />
      <Route path="/map" component={MapPage} />
      <Route path="/chat" component={ChatPage} />
      <Route path="/profile" component={ProfilePage} />
      <Route path="/complaints" component={ComplaintPage} />
      <Route path="/notifications" component={NotificationsPage} />
      <Route path="/unauthorized" component={UnauthorizedPage} />
      <Route path="/admin" component={AdminDashboardPage} />
      <Route path="/admin/complaints" component={AdminComplaintsPage} />
      <Route path="/admin/users" component={AdminUsersPage} />
      <Route path="/admin/listings" component={AdminListingsPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

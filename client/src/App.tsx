import { Route, Switch } from "wouter";
import AddListingPage from "./pages/AddListingPage";
import ChatPage from "./pages/ChatPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import HomePage from "./pages/HomePage";
import ListingsPage from "./pages/ListingsPage";
import LoginPage from "./pages/LoginPage";
import MapPage from "./pages/MapPage";
import NotFound from "./pages/NotFound";
import PetDetailPage from "./pages/PetDetailPage";
import ProfilePage from "./pages/ProfilePage";
import RegisterPage from "./pages/RegisterPage";

export default function App() {
  return <Switch>
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
    <Route component={NotFound} />
  </Switch>;
}

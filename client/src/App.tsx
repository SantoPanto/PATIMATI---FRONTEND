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

function App() {
  return (
    <Switch>
      <Route path="/" component={HomePage} />

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

      <Route path="/listings" component={ListingsPage} />
      <Route path="/add-listing" component={AddListingPage} />
      <Route path="/map" component={MapPage} />
      <Route path="/chat" component={ChatPage} />
      <Route path="/profile" component={ProfilePage} />
      <Route path="/pet/:id" component={PetDetailPage} />
      <Route path="/adoption" component={Adoption} />
      <Route path="/settings" component={SettingsPage} />
      <Route path="/adoption/:id" component={AdoptionDetailPage} />
      <Route path="/favorites" component={FavoritesPage} />
      
      

      <Route component={NotFound} />
    </Switch>
  );
}

export default App;
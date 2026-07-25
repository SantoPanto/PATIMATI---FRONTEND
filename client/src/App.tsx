import { Route, Switch } from "wouter";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import MapPage from "./pages/MapPage";
import ListingsPage from "./pages/ListingsPage";
import PetDetailPage from "./pages/PetDetailPage";
import ChatPage from "./pages/ChatPage";
import ProfilePage from "./pages/ProfilePage";
import AddListingPage from "./pages/AddListingPage";
import NotFound from "./pages/NotFound";

function App() {
  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/login" component={LoginPage} />
      <Route path="/register" component={RegisterPage} />
      <Route path="/forgot-password" component={ForgotPasswordPage} />
      <Route path="/map" component={MapPage} />
      <Route path="/listings" component={ListingsPage} />
      <Route path="/pet/:id" component={PetDetailPage} />
      <Route path="/chat" component={ChatPage} />
      <Route path="/profile" component={ProfilePage} />
      <Route path="/add-listing" component={AddListingPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

export default App;
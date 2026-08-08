Login redirect route

The backend's OAuth2 login handler redirects users to the frontend with a token query parameter:

  /login?token=eyJ... 

Add a route in your React router to handle `/login` and mount `LoginRedirectPage`.

Example (React Router v6):

```tsx
import { BrowserRouter, Routes, Route } from "react-router-dom";
import LoginRedirectPage from "./pages/LoginRedirectPage";
import AddListingPage from "./pages/AddListingPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginRedirectPage />} />
        <Route path="/add-listing" element={<AddListingPage />} />
        {/* ...other routes... */}
      </Routes>
    </BrowserRouter>
  );
}
```

If your project uses a different router setup, add an equivalent route that renders `LoginRedirectPage` on `/login`.

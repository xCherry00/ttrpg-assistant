import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./auth/AuthContext";
import AppErrorBoundary from "./components/AppErrorBoundary";

import "./styles/theme.css";
import "./styles/globals.css";
import "./styles/ui.css";
import "./styles/topnav.css";
import "./styles/glossary.css";
import "./styles/dice.css";
import "./styles/auth.css";
import "./styles/home.css";
import "./styles/dashboard.css";
import "./styles/settings.css";
import "./styles/generators.css";
import "./styles/profile.css";
import "./styles/friends.css";



import App from "./App";

const storedTheme = localStorage.getItem("ttrpg_theme") || "dark";
document.documentElement.setAttribute("data-theme", storedTheme);

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AppErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <App />
        </AuthProvider>
      </BrowserRouter>
    </AppErrorBoundary>
  </React.StrictMode>
);

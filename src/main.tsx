import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { Provider } from "react-redux";
import { HeroUIProvider } from "@heroui/react";
import { store } from "@/store";
import { router } from "@/routes";
import "@/lib/i18n";
import "./index.css";

// Set dark theme by default
const savedTheme = localStorage.getItem("trader-journal-theme");
if (!savedTheme) {
  localStorage.setItem("trader-journal-theme", "dark");
}
document.documentElement.classList.add(savedTheme || "dark");

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Provider store={store}>
      <HeroUIProvider>
        <RouterProvider router={router} />
      </HeroUIProvider>
    </Provider>
  </StrictMode>
);

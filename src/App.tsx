import { Route, Routes } from "react-router";
import AdminLayout from "./components/AdminLayout";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./Login";
import Register from "./Register";
import Dashboard from "./pages/Dashboard";
import NotFound from "./pages/NotFound";
import ProductCategoryPage from "./pages/ProductCategory";
import UsersPage from "./pages/Users";
import { SettingsPage } from "./pages/Placeholder";

function App() {
  return (
    <Routes>
      <Route
        path="/"
        element={<ProtectedRoute />}
      >
        <Route element={<AdminLayout />}>
          <Route
            index
            element={<Dashboard />}
          />
          <Route
            path="users"
            element={<UsersPage />}
          />
          <Route
            path="settings"
            element={<SettingsPage />}
          />
          <Route
            path="product/category"
            element={<ProductCategoryPage />}
          />
        </Route>
      </Route>
      <Route
        path="/login"
        element={<Login />}
      />
      <Route
        path="/register"
        element={<Register />}
      />
      <Route
        path="*"
        element={<NotFound />}
      />
    </Routes>
  );
}

export default App;

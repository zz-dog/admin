import { Route, Routes } from "react-router";
import AdminLayout from "./components/AdminLayout";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./Login";
import Register from "./Register";
import Dashboard from "./pages/Dashboard";
import NotFound from "./pages/NotFound";
import ProductCategoryPage from "./pages/ProductCategory";
import ProductsPage from "./pages/Products";
import SpecsPage from "./pages/Specs";
import UsersPage from "./pages/Users";
import { Placeholder, SettingsPage } from "./pages/Placeholder";

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
          <Route
            path="product/spec"
            element={<SpecsPage />}
          />
          <Route
            path="product/list"
            element={<ProductsPage />}
          />
          <Route
            path="product/brand"
            element={<Placeholder title="商品品牌" />}
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

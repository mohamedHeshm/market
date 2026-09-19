import { Suspense, lazy } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  Store,
  Bike,
  Tag,
  Package,
  ClipboardList,
  Wallet,
  Settings,
  PackageSearch,
  UserRound,
} from 'lucide-react'

import { UserShell } from '@/components/layout/UserShell'
import { DashboardShell } from '@/components/layout/DashboardShell'
import { RequireAuth, RequireRole, FullscreenSpinner } from '@/components/common/RouteGuards'

const LoginPage = lazy(() => import('@/pages/public/Login'))
const RegisterPage = lazy(() => import('@/pages/public/Register'))
const ForgotPasswordPage = lazy(() => import('@/pages/public/ForgotPassword'))
const ResetPasswordPage = lazy(() => import('@/pages/public/ResetPassword'))
const NotFoundPage = lazy(() => import('@/pages/public/NotFound'))
const AccountDisabledPage = lazy(() => import('@/pages/public/AccountDisabled'))

const HomePage = lazy(() => import('@/pages/public/Home'))
const StoresPage = lazy(() => import('@/pages/user/Stores'))
const StoreDetailPage = lazy(() => import('@/pages/user/StoreDetail'))
const CategoryDetailPage = lazy(() => import('@/pages/user/CategoryDetail'))
const ProductDetailPage = lazy(() => import('@/pages/user/ProductDetail'))
const CartPage = lazy(() => import('@/pages/user/Cart'))
const CheckoutPage = lazy(() => import('@/pages/user/Checkout'))
const OrdersPage = lazy(() => import('@/pages/user/Orders'))
const OrderDetailPage = lazy(() => import('@/pages/user/OrderDetail'))
const AddressesPage = lazy(() => import('@/pages/user/Addresses'))
const ProfilePage = lazy(() => import('@/pages/user/Profile'))
const NotificationsPage = lazy(() => import('@/pages/user/Notifications'))

const AdminDashboardPage = lazy(() => import('@/pages/admin/Dashboard'))
const AdminUsersPage = lazy(() => import('@/pages/admin/Users'))
const AdminStoresPage = lazy(() => import('@/pages/admin/Stores'))
const AdminDeliveryPage = lazy(() => import('@/pages/admin/Delivery'))
const AdminCategoriesPage = lazy(() => import('@/pages/admin/Categories'))
const AdminProductsPage = lazy(() => import('@/pages/admin/Products'))
const AdminOrdersPage = lazy(() => import('@/pages/admin/Orders'))
const AdminPaymentsPage = lazy(() => import('@/pages/admin/Payments'))
const AdminSettingsPage = lazy(() => import('@/pages/admin/Settings'))

const StoreDashboardPage = lazy(() => import('@/pages/store/Dashboard'))
const StoreProductsPage = lazy(() => import('@/pages/store/Products'))
const StoreProductFormPage = lazy(() => import('@/pages/store/ProductForm'))
const StoreOrdersPage = lazy(() => import('@/pages/store/Orders'))
const StoreProfilePage = lazy(() => import('@/pages/store/Profile'))

const DeliveryDashboardPage = lazy(() => import('@/pages/delivery/Dashboard'))
const DeliveryAvailableOrdersPage = lazy(() => import('@/pages/delivery/AvailableOrders'))
const DeliveryMyOrdersPage = lazy(() => import('@/pages/delivery/MyOrders'))
const DeliveryOrderDetailPage = lazy(() => import('@/pages/delivery/OrderDetail'))
const DeliveryProfilePage = lazy(() => import('@/pages/delivery/Profile'))

const adminNav = [
  { to: '/admin', label: 'لوحة التحكم', icon: <LayoutDashboard size={18} />, end: true },
  { to: '/admin/users', label: 'المستخدمون', icon: <Users size={18} /> },
  { to: '/admin/stores', label: 'المتاجر', icon: <Store size={18} /> },
  { to: '/admin/delivery', label: 'مندوبو التوصيل', icon: <Bike size={18} /> },
  { to: '/admin/categories', label: 'الأقسام', icon: <Tag size={18} /> },
  { to: '/admin/products', label: 'المنتجات', icon: <Package size={18} /> },
  { to: '/admin/orders', label: 'الطلبات', icon: <ClipboardList size={18} /> },
  { to: '/admin/payments', label: 'المدفوعات', icon: <Wallet size={18} /> },
  { to: '/admin/settings', label: 'الإعدادات', icon: <Settings size={18} /> },
]

const storeNav = [
  { to: '/store', label: 'لوحة التحكم', icon: <LayoutDashboard size={18} />, end: true },
  { to: '/store/products', label: 'المنتجات', icon: <Package size={18} /> },
  { to: '/store/orders', label: 'الطلبات', icon: <ClipboardList size={18} /> },
  { to: '/store/profile', label: 'بيانات المتجر', icon: <Store size={18} /> },
]

const deliveryNav = [
  { to: '/delivery', label: 'لوحة التحكم', icon: <LayoutDashboard size={18} />, end: true },
  { to: '/delivery/available', label: 'طلبات متاحة', icon: <PackageSearch size={18} /> },
  { to: '/delivery/orders', label: 'طلباتي', icon: <Bike size={18} /> },
  { to: '/delivery/profile', label: 'حسابي', icon: <UserRound size={18} /> },
]

export function AppRouter() {
  return (
    <Suspense fallback={<FullscreenSpinner />}>
      <Routes>
      {/* ---------- Public auth pages (no shell) ---------- */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/account-disabled" element={<AccountDisabledPage />} />

      {/* ---------- Public + user shell ---------- */}
      <Route element={<UserShell />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/stores" element={<StoresPage />} />
        <Route path="/stores/:id" element={<StoreDetailPage />} />
        <Route path="/categories/:id" element={<CategoryDetailPage />} />
        <Route path="/product/:id" element={<ProductDetailPage />} />
        <Route path="/cart" element={<CartPage />} />

        <Route element={<RequireAuth />}>
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/orders" element={<OrdersPage />} />
          <Route path="/orders/:id" element={<OrderDetailPage />} />
          <Route path="/addresses" element={<AddressesPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
        </Route>
      </Route>

      {/* ---------- Admin ---------- */}
      <Route element={<RequireAuth />}>
        <Route element={<RequireRole roles={['ADMIN']} />}>
          <Route element={<DashboardShell navItems={adminNav} title="لوحة تحكم الإدارة" />}>
            <Route path="/admin" element={<AdminDashboardPage />} />
            <Route path="/admin/users" element={<AdminUsersPage />} />
            <Route path="/admin/stores" element={<AdminStoresPage />} />
            <Route path="/admin/delivery" element={<AdminDeliveryPage />} />
            <Route path="/admin/categories" element={<AdminCategoriesPage />} />
            <Route path="/admin/products" element={<AdminProductsPage />} />
            <Route path="/admin/orders" element={<AdminOrdersPage />} />
            <Route path="/admin/payments" element={<AdminPaymentsPage />} />
            <Route path="/admin/settings" element={<AdminSettingsPage />} />
            <Route path="/admin/notifications" element={<NotificationsPage />} />
          </Route>
        </Route>

        {/* ---------- Store ---------- */}
        <Route element={<RequireRole roles={['STORE']} />}>
          <Route element={<DashboardShell navItems={storeNav} title="لوحة تحكم المتجر" />}>
            <Route path="/store" element={<StoreDashboardPage />} />
            <Route path="/store/products" element={<StoreProductsPage />} />
            <Route path="/store/products/new" element={<StoreProductFormPage />} />
            <Route path="/store/products/:id" element={<StoreProductFormPage />} />
            <Route path="/store/orders" element={<StoreOrdersPage />} />
            <Route path="/store/profile" element={<StoreProfilePage />} />
            <Route path="/store/notifications" element={<NotificationsPage />} />
          </Route>
        </Route>

        {/* ---------- Delivery ---------- */}
        <Route element={<RequireRole roles={['DELIVERY']} />}>
          <Route element={<DashboardShell navItems={deliveryNav} title="لوحة تحكم التوصيل" />}>
            <Route path="/delivery" element={<DeliveryDashboardPage />} />
            <Route path="/delivery/available" element={<DeliveryAvailableOrdersPage />} />
            <Route path="/delivery/orders" element={<DeliveryMyOrdersPage />} />
            <Route path="/delivery/orders/:id" element={<DeliveryOrderDetailPage />} />
            <Route path="/delivery/profile" element={<DeliveryProfilePage />} />
            <Route path="/delivery/notifications" element={<NotificationsPage />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  )
}

export function RedirectHome() {
  return <Navigate to="/" replace />
}

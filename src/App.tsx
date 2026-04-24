import '@mantine/core/styles.css';
import { MantineProvider, createTheme } from '@mantine/core';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { getMenuAccessForPhone } from './auth/phoneRoles';
import { OrdersPage } from './pages/OrdersPage';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ShiftProvider } from './context/ShiftContext';
import { AuthPage } from './pages/AuthPage';
import { HomePage } from './pages/HomePage';
import { SalaryPage } from './pages/SalaryPage';
import { ShiftPage } from './pages/ShiftPage';
import { ChangeRolePage } from './pages/ChangeRolePage';

const theme = createTheme({
  fontFamily: 'Inter, system-ui, Avenir, Helvetica, Arial, sans-serif',
  primaryColor: 'orange',
  defaultRadius: 'md',
  components: {
    Button: {
      defaultProps: {
        size: 'md',
      },
    },
    TextInput: {
      defaultProps: {
        size: 'md',
      },
    },
  },
});

function RootOrHome() {
  const { session } = useAuth();
  return session ? <HomePage /> : <AuthPage />;
}

function SalaryRoute() {
  const { session } = useAuth();
  if (!session) {
    return <Navigate to="/" replace />;
  }
  if (!getMenuAccessForPhone(session.phone).salary) {
    return <Navigate to="/" replace />;
  }
  return <SalaryPage />;
}

function ShiftRoute() {
  const { session } = useAuth();
  if (!session) {
    return <Navigate to="/" replace />;
  }
  if (!getMenuAccessForPhone(session.phone).shift) {
    return <Navigate to="/" replace />;
  }
  return <ShiftPage />;
}

function OrdersRoute() {
  const { session } = useAuth();
  if (!session) {
    return <Navigate to="/" replace />;
  }
  if (!getMenuAccessForPhone(session.phone).orders) {
    return <Navigate to="/" replace />;
  }
  return <OrdersPage />;
}

function ChangeRoleRoute() {
  const { session } = useAuth();
  if (!session) {
    return <Navigate to="/" replace />;
  }
  if (!getMenuAccessForPhone(session.phone).changeRole) {
    return <Navigate to="/" replace />;
  }
  return <ChangeRolePage />;
}

function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<RootOrHome />} />
        <Route path="/salary" element={<SalaryRoute />} />
        <Route path="/shift" element={<ShiftRoute />} />
        <Route path="/orders" element={<OrdersRoute />} />
        <Route path="/change-role" element={<ChangeRoleRoute />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

function App() {
  return (
    <MantineProvider theme={theme} defaultColorScheme="light">
      <AuthProvider>
        <ShiftProvider>
          <AppRoutes />
        </ShiftProvider>
      </AuthProvider>
    </MantineProvider>
  );
}

export default App;

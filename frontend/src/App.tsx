import { Routes, Route, BrowserRouter, Outlet, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext"
import { ThemeProvider } from "./contexts/ThemeContext"
import { Login } from "./pages/Login/Login"
import { Register } from "./pages/Register/Register";
import { CompanyEditor } from "./pages/CompanyEditor/CompanyEditor";
import { TourEditor } from "./pages/TourEditor/TourEditor";
import { CompaniesList } from "./pages/CompaniesList/CompaniesList";
import { CompanyViewer } from "./pages/CompanyViewer/CompanyViewer";
import { TourViewer } from "./pages/TourViewer/TourViewer";
import { Logout } from "./pages/Logout/Logout";
import { Header } from "./components/Header/Header";
import { useAuth } from "./contexts/AuthContext";
import { Join } from "./pages/Join/Join";

function LayoutWithHeader() {
	return (
		<>
		<Header />
		<Outlet />
		</>
	);
}

function ProtectedRoute() {
	const { user, isLoading } = useAuth();

	if (isLoading) return <div>Loading</div>;

	if (!user?.id) return <Navigate to="/login" replace />;

	return <Outlet />;
}

function AppRoutes() {
	return (
		<Routes>
			<Route path="/" element={<Navigate to="/login" replace />} />
			<Route path="" element={<Navigate to="/login" replace />} />
			<Route element={<LayoutWithHeader />}>
				<Route path="/join" element={<Join />} />
				<Route path="/login" element={<Login />} />
				<Route path="/register" element={<Register />} />

				<Route element={<ProtectedRoute />}>
					<Route path="/logout" element={<Logout />} />
					<Route path="/company/new" element={<CompanyEditor />} />
					<Route path="/company/edit/:companyId" element={<CompanyEditor />} />
					<Route path="/company/edit/:companyId" element={<CompanyEditor />} />

					<Route path="/companies/my" element={<CompaniesList />} />
					<Route path="/company/:companyId" element={<CompanyViewer />} />
					<Route path="/company/:companyId/tours/new" element={<TourEditor />} />
					<Route path="/company/:companyId/tours/edit/:tourId" element={<TourEditor />} />
				</Route>

			</Route>
			<Route path="/session/:tourId/:sessionId" element={<TourViewer />} />
		</Routes>
	);
}

function App() {
	return (
		<BrowserRouter>
			<ThemeProvider>
				<AuthProvider>
					<AppRoutes />
				</AuthProvider>
			</ThemeProvider>
		</BrowserRouter>
	)
}

export default App;

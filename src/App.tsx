// src/App.tsx
import { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import { AuthProvider } from './contexts/AuthContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import WhatsAppFloatingButton from './components/WhatsAppFloatingButton';
import CookieBanner from './components/CookieBanner';

const HomePage = lazy(() => import('./pages/HomePage'));
const PropertiesPage = lazy(() => import('./pages/PropertiesPage'));
const PropertyDetailPage = lazy(() => import('./pages/PropertyDetailPage'));
const VehiclesPage = lazy(() => import('./pages/VehiclesPage'));
const VehicleDetailPage = lazy(() => import('./pages/VehicleDetailPage'));
const FavoritesPage = lazy(() => import('./pages/FavoritesPage'));
const ContactPage = lazy(() => import('./pages/ContactPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const AdminPage = lazy(() => import('./pages/AdminPage'));
const GuidePage = lazy(() => import('./pages/GuidePage'));
const GuideDetailPage = lazy(() => import('./pages/GuideDetailPage'));
const ProjectsPage = lazy(() => import('./pages/ProjectsPage'));
const AboutPage = lazy(() => import('./pages/AboutPage'));
const AiChatWidget = lazy(() => import('./components/AiChatWidget'));

type Page =
  | 'home'
  | 'properties'
  | 'property-detail'
  | 'vehicles'
  | 'vehicle-detail'
  | 'favorites'
  | 'contact'
  | 'login'
  | 'admin'
  | 'guide'
  | 'guide-detail'
  | 'projects'
  | 'about';

function PageLoader() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="text-center">
        <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-gray-200 border-t-emerald-600" />
        <p className="text-sm text-gray-600">Yükleniyor...</p>
      </div>
    </div>
  );
}

function App() {
  const [currentPage, setCurrentPage] = useState<Page>('home');
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
  const [selectedGuideSlug, setSelectedGuideSlug] = useState<string | null>(null);

  const routes = useMemo(() => {
    return {
      home: '/',
      properties: '/properties',
      propertyDetail: (id: string) => `/properties/${id}`,
      vehicles: '/vehicles',
      vehicleDetail: (id: string) => `/vehicles/${id}`,
      favorites: '/favorites',
      contact: '/contact',
      login: '/login',
      admin: '/admin',
      guide: '/rehber',
      guideDetail: (slug: string) => `/rehber/${slug}`,
      projects: '/projects',
      about: '/about',
    };
  }, []);

  const applyLocationToState = () => {
    const path = window.location.pathname || '/';

    const propMatch = path.match(/^\/properties\/([^/]+)$/);
    if (propMatch) {
      setSelectedPropertyId(propMatch[1]);
      setCurrentPage('property-detail');
      return;
    }

    const vehMatch = path.match(/^\/vehicles\/([^/]+)$/);
    if (vehMatch) {
      setSelectedVehicleId(vehMatch[1]);
      setCurrentPage('vehicle-detail');
      return;
    }

    const guideMatch = path.match(/^\/rehber\/([^/]+)$/);
    if (guideMatch) {
      setSelectedGuideSlug(guideMatch[1]);
      setCurrentPage('guide-detail');
      return;
    }

    if (path === '/rehber') {
      setCurrentPage('guide');
      return;
    }

    if (path === '/projects') {
      setCurrentPage('projects');
      return;
    }

    if (path === '/about') {
      setCurrentPage('about');
      return;
    }

    if (path === '/properties') {
      setCurrentPage('properties');
      return;
    }

    if (path === '/vehicles') {
      setCurrentPage('vehicles');
      return;
    }

    if (path === '/favorites') {
      setCurrentPage('favorites');
      return;
    }

    if (path === '/contact') {
      setCurrentPage('contact');
      return;
    }

    if (path === '/login') {
      setCurrentPage('login');
      return;
    }

    if (path === '/admin') {
      setCurrentPage('admin');
      return;
    }

    setCurrentPage('home');
  };

  useEffect(() => {
    applyLocationToState();

    const handlePopState = () => applyLocationToState();
    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  const handleNavigate = (page: string, id?: string) => {
    let url = '/';

    if (page === 'home') {
      url = routes.home;
      setSelectedPropertyId(null);
      setSelectedVehicleId(null);
      setSelectedGuideSlug(null);
    } else if (page === 'properties') {
      url = routes.properties;
      setSelectedPropertyId(null);
    } else if (page === 'vehicles') {
      url = routes.vehicles;
      setSelectedVehicleId(null);
    } else if (page === 'favorites') {
      url = routes.favorites;
    } else if (page === 'contact') {
      url = routes.contact;
    } else if (page === 'login') {
      url = routes.login;
    } else if (page === 'admin') {
      url = routes.admin;
    } else if (page === 'guide') {
      url = routes.guide;
      setSelectedGuideSlug(null);
    } else if (page === 'projects') {
      url = routes.projects;
    } else if (page === 'about') {
      url = routes.about;
    } else if (page === 'guide-detail' && id) {
      url = routes.guideDetail(id);
      setSelectedGuideSlug(id);
    } else if (page === 'property-detail' && id) {
      url = routes.propertyDetail(id);
      setSelectedPropertyId(id);
    } else if (page === 'vehicle-detail' && id) {
      url = routes.vehicleDetail(id);
      setSelectedVehicleId(id);
    }

    window.history.pushState({}, '', url);
    setCurrentPage(page as Page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return <HomePage onNavigate={handleNavigate} />;

      case 'properties':
        return <PropertiesPage onNavigate={handleNavigate} />;

      case 'vehicles':
        return <VehiclesPage onNavigate={handleNavigate} />;

      case 'favorites':
        return <FavoritesPage onNavigate={handleNavigate} />;

      case 'guide':
        return <GuidePage onNavigate={handleNavigate} />;

      case 'guide-detail':
        return selectedGuideSlug ? (
          <GuideDetailPage slug={selectedGuideSlug} onNavigate={handleNavigate} />
        ) : (
          <GuidePage onNavigate={handleNavigate} />
        );

      case 'projects':
        return <ProjectsPage onNavigate={handleNavigate} />;

      case 'about':
        return <AboutPage onNavigate={handleNavigate} />;

      case 'property-detail':
        return selectedPropertyId ? (
          <PropertyDetailPage propertyId={selectedPropertyId} onNavigate={handleNavigate} />
        ) : (
          <HomePage onNavigate={handleNavigate} />
        );

      case 'vehicle-detail':
        return selectedVehicleId ? (
          <VehicleDetailPage vehicleId={selectedVehicleId} onNavigate={handleNavigate} />
        ) : (
          <VehiclesPage onNavigate={handleNavigate} />
        );

      case 'contact':
        return <ContactPage />;

      case 'login':
        return <LoginPage onNavigate={handleNavigate} />;

      case 'admin':
        return <AdminPage onNavigate={handleNavigate} />;

      default:
        return <HomePage onNavigate={handleNavigate} />;
    }
  };

  return (
    <AuthProvider>
      <div className="min-h-screen bg-gray-50">
        <Navbar currentPage={currentPage} onNavigate={handleNavigate} />

        <Suspense fallback={<PageLoader />}>{renderPage()}</Suspense>

        <Footer onNavigate={handleNavigate} />

        <Suspense fallback={null}>
          <AiChatWidget />
        </Suspense>

        <WhatsAppFloatingButton />
        <CookieBanner />
      </div>
    </AuthProvider>
  );
}

export default App;
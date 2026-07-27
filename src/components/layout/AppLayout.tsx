import { Routes, Route } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { ROUTES } from '../../routes';

export function AppLayout() {
  return (
    <div className="app">
      <Sidebar />
      <div className="main">
        <Header />
        <main className="content">
          <Routes>
            {ROUTES.map((r) => (
              <Route key={r.path} path={r.path} element={<r.element />} />
            ))}
          </Routes>
        </main>
      </div>
    </div>
  );
}

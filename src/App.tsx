import { HashRouter } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';

export default function App() {
  return (
    <HashRouter>
      <AppLayout />
    </HashRouter>
  );
}

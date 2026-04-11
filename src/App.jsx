import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Home } from './components/Home';
import "./main.css"

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Home />
    </QueryClientProvider>
  );
}

export default App;
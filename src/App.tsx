import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import { GlobalMessageListener } from '@/components/GlobalMessageListener';
import { SystemSettingsProvider } from "@/components/SystemSettings/SystemSettingsContext";

const queryClient = new QueryClient();
console.log('APP ENV:', import.meta.env.VITE_APP_ENV);
const App = () => (
  <QueryClientProvider client={queryClient}>
    <SystemSettingsProvider>
      <TooltipProvider>
        <GlobalMessageListener />
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </SystemSettingsProvider>
  </QueryClientProvider>
);

export default App;

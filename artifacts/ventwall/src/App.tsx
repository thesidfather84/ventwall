import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { useEffect } from "react";
import { GeoGate } from "@/components/geo-gate";

// Pages
import Home from "@/pages/home";
import Feed from "@/pages/feed";
import PostComposer from "@/pages/post";
import Admin from "@/pages/admin";
import MyEchoes from "@/pages/my-echoes";
import Settings from "@/pages/settings";
import { WhatIsVentWall, SafetyRules, Terms, Privacy, ContentPolicy } from "@/pages/static-pages";

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/feed" component={Feed} />
      <Route path="/post" component={PostComposer} />
      <Route path="/admin" component={Admin} />
      <Route path="/my-echoes" component={MyEchoes} />
      <Route path="/settings" component={Settings} />
      <Route path="/what-is-ventwall" component={WhatIsVentWall} />
      <Route path="/safety" component={SafetyRules} />
      <Route path="/terms" component={Terms} />
      <Route path="/privacy" component={Privacy} />
      <Route path="/content-policy" component={ContentPolicy} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  useEffect(() => {
    document.documentElement.classList.add("dark");
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <GeoGate>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
          <Toaster />
        </GeoGate>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;

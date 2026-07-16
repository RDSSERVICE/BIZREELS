import { Link } from "react-router-dom";
import { Home } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="w-full max-w-7xl mx-auto min-h-screen relative bg-black text-white animate-page-enter flex flex-col items-center justify-center px-6 text-center">
      <div className="mb-6">
        <div className="text-8xl font-heading font-black bg-gradient-brand bg-clip-text text-transparent" data-testid="notfound-code">404</div>
      </div>
      <h1 className="font-heading text-2xl font-bold mb-2">Page not found</h1>
      <p className="text-sm text-white/60 mb-6 max-w-xs">
        The page you were looking for doesn't exist or has moved.
      </p>
      <Link to="/" data-testid="notfound-home-btn">
        <Button className="rounded-full h-11 btn-brand border-0 font-semibold">
          <Home className="h-4 w-4 mr-2" /> Back to home
        </Button>
      </Link>
    </div>
  );
}

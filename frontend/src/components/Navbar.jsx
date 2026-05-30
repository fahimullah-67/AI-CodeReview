import { Link, useLocation } from "react-router-dom";
import { Bot, LayoutDashboard, GitPullRequest, Settings } from "lucide-react";

export default function Navbar() {
  const location = useLocation();
  const links = [
    { to: "/", label: "Dashboard", icon: <LayoutDashboard size={16} /> },
    { to: "/reviews", label: "Reviews", icon: <GitPullRequest size={16} /> },
    { to: "/settings", label: "Settings", icon: <Settings size={16} /> },
  ];

  return (
    <nav className="border-b border-[#21262d] bg-[#161b22] px-6 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bot className="text-purple-500" size={24} />
          <span className="font-bold text-lg">CodeReview AI</span>
        </div>
        <div className="flex items-center gap-6">
          {links.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={`flex items-center gap-2 text-sm transition-colors
                ${location.pathname === link.to
                  ? "text-purple-400 font-medium"
                  : "text-gray-400 hover:text-white"}`}
            >
              {link.icon}
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}
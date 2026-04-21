import Link from 'next/link';
import { Book, Code, Rocket, Shield, Info } from 'lucide-react';

export default function DocsPage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Navigation */}
      <nav className="border-b border-border bg-card z-50 sticky top-0">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-primary overflow-hidden flex items-center justify-center">
              <Book size={18} className="text-primary-foreground" />
            </div>
            <span className="font-bold text-xl tracking-tight text-foreground font-display">WorkforceHub <span className="text-muted-foreground font-normal">/ Docs</span></span>
          </div>
          <div className="flex items-center gap-6">
            <Link href="/" className="text-sm font-medium text-gray-400 hover:text-white transition-colors">← Back to App</Link>
          </div>
        </div>
      </nav>

      <main className="flex-1 max-w-5xl mx-auto w-full px-6 py-20">
        <div className="mb-16">
          <h1 className="text-5xl font-extrabold mb-6 tracking-tight">Documentation</h1>
          <p className="text-xl text-gray-400 max-w-2xl leading-relaxed">
            Everything you need to build, deploy, and scale autonomous AI agent clusters
            on the AgentHub platform.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-20">
          <Link href="#" className="bg-[#111] border border-[#222] hover:border-blue-500/50 p-8 rounded-2xl transition-all group">
            <div className="w-12 h-12 bg-blue-600/10 rounded-xl flex items-center justify-center text-blue-400 mb-6 group-hover:bg-blue-600 group-hover:text-white transition-all">
              <Rocket size={24} />
            </div>
            <h3 className="text-xl font-bold mb-3">Getting Started</h3>
            <p className="text-gray-400 text-sm leading-relaxed mb-4">Learn the core concepts of the AgentHub ecosystem and set up your first agent in minutes.</p>
            <span className="text-xs font-bold uppercase tracking-widest text-blue-400">Step-by-step Guide →</span>
          </Link>

          <Link href="#" className="bg-[#111] border border-[#222] hover:border-purple-500/50 p-8 rounded-2xl transition-all group">
            <div className="w-12 h-12 bg-purple-600/10 rounded-xl flex items-center justify-center text-purple-400 mb-6 group-hover:bg-purple-600 group-hover:text-white transition-all">
              <Code size={24} />
            </div>
            <h3 className="text-xl font-bold mb-3">API Reference</h3>
            <p className="text-gray-400 text-sm leading-relaxed mb-4">Complete technical specification for the AgentHub REST API and various SDKs.</p>
            <span className="text-xs font-bold uppercase tracking-widest text-purple-400">Endpoint Docs →</span>
          </Link>

          <Link href="#" className="bg-[#111] border border-[#222] hover:border-green-500/50 p-8 rounded-2xl transition-all group">
            <div className="w-12 h-12 bg-green-600/10 rounded-xl flex items-center justify-center text-green-400 mb-6 group-hover:bg-green-600 group-hover:text-white transition-all">
              <Shield size={24} />
            </div>
            <h3 className="text-xl font-bold mb-3">Authentication</h3>
            <p className="text-gray-400 text-sm leading-relaxed mb-4">Secure your agent operations with JWT and OAuth2 integration guides.</p>
            <span className="text-xs font-bold uppercase tracking-widest text-green-400">Security Guide →</span>
          </Link>

          <Link href="#" className="bg-[#111] border border-[#222] hover:border-yellow-500/50 p-8 rounded-2xl transition-all group">
            <div className="w-12 h-12 bg-yellow-600/10 rounded-xl flex items-center justify-center text-yellow-400 mb-6 group-hover:bg-yellow-600 group-hover:text-white transition-all">
              <Book size={24} />
            </div>
            <h3 className="text-xl font-bold mb-3">Tutorials</h3>
            <p className="text-gray-400 text-sm leading-relaxed mb-4">Deep dives into building complex research and automation workflows.</p>
            <span className="text-xs font-bold uppercase tracking-widest text-yellow-400">Learn More →</span>
          </Link>
        </div>

        <div className="bg-blue-600/5 border border-blue-500/20 rounded-2xl p-8 flex items-start gap-6">
          <div className="shrink-0 w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white">
            <Info size={20} />
          </div>
          <div>
            <h4 className="font-bold text-lg mb-2">Need direct assistance?</h4>
            <p className="text-gray-400 text-sm mb-4">Our community and support team are available to help you with any technical hurdles.</p>
            <button className="text-blue-400 text-sm font-bold hover:text-blue-300 transition-colors">Join our Discord</button>
          </div>
        </div>
      </main>

      <footer className="border-t border-[#1a1a1a] py-12 mt-20">
        <div className="max-w-7xl mx-auto px-6 text-center text-sm text-gray-500">
          AgentHub Documentation © 2026. Built with precision for developers.
        </div>
      </footer>
    </div>
  );
}

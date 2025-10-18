"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Hexagon, Home, User, BarChart3, BookOpen, MessageCircle, Sparkles, Target, ArrowRight, Menu, X } from "lucide-react"
import { useState } from "react"

export default function HomePage() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  return (
    <div className="min-h-screen gradient-bg flex flex-col">
      {/* Header */}
      <header className="header-bg">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="logo-gradient rounded-lg p-2">
                <Hexagon className="h-6 w-6 text-white" />
              </div>
              <Sparkles className="h-3 w-3 text-white absolute -top-1 -right-1" />
            </div>
            <div>
              <div className="text-xl font-bold text-white">Smart Hive Solutions</div>
              <div className="text-sm text-white/80">Beekeeping Excellence</div>
            </div>
          </div>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <Link href="#" className="flex items-center gap-2 text-white hover:text-white/80 transition-colors">
              <Home className="h-4 w-4" />
              Home
            </Link>
            <Link href="#" className="flex items-center gap-2 text-white hover:text-white/80 transition-colors">
              <User className="h-4 w-4" />
              About
            </Link>
            <Link href="#" className="flex items-center gap-2 text-white hover:text-white/80 transition-colors">
              <BarChart3 className="h-4 w-4" />
              Analytics
            </Link>
            <Link href="#" className="flex items-center gap-2 text-white hover:text-white/80 transition-colors">
              <BookOpen className="h-4 w-4" />
              Training
            </Link>
            <Link href="#" className="flex items-center gap-2 text-white hover:text-white/80 transition-colors">
              <MessageCircle className="h-4 w-4" />
              Support
            </Link>
            <div className="flex items-center gap-2">
              <Link href="/login" className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg transition-colors">
                Login
              </Link>
            </div>
          </nav>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden text-white hover:text-white/80 transition-colors"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Navigation Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-white/10 backdrop-blur-sm border-t border-white/20">
            <nav className="container mx-auto px-4 py-4 flex flex-col gap-4">
              <Link 
                href="#" 
                className="flex items-center gap-2 text-white hover:text-white/80 transition-colors py-2"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <Home className="h-4 w-4" />
                Home
              </Link>
              <Link 
                href="#" 
                className="flex items-center gap-2 text-white hover:text-white/80 transition-colors py-2"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <User className="h-4 w-4" />
                About
              </Link>
              <Link 
                href="#" 
                className="flex items-center gap-2 text-white hover:text-white/80 transition-colors py-2"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <BarChart3 className="h-4 w-4" />
                Analytics
              </Link>
              <Link 
                href="#" 
                className="flex items-center gap-2 text-white hover:text-white/80 transition-colors py-2"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <BookOpen className="h-4 w-4" />
                Training
              </Link>
              <Link 
                href="#" 
                className="flex items-center gap-2 text-white hover:text-white/80 transition-colors py-2"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <MessageCircle className="h-4 w-4" />
                Support
              </Link>
              <div className="flex gap-2 mt-2">
                <Link 
                  href="/login" 
                  className="flex-1 bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg transition-colors text-center"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Login
                </Link>
              </div>
            </nav>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-4 md:py-6 flex-1">
        <div className="max-w-4xl mx-auto">
          {/* Professional Badge */}
          <div className="flex items-center gap-2 mb-3">
            <div className="logo-gradient rounded-full p-1">
              <Target className="h-3 w-3 text-white" />
            </div>
            <span className="text-white text-xs font-medium">Professional Beekeeping Platform</span>
          </div>
          
          {/* Main Heading */}
          <h1 className="text-xl md:text-3xl font-bold text-white mb-3 leading-tight">
            Find me the{" "}
            <span className="text-[#FF8C00]">best</span>{" "}
            <span className="text-[#FF69B4]">hive management</span>{" "}
            for{" "}
            <span className="text-[#00BFFF]">your beekeeping future</span>{" "}
            that offers{" "}
            <span className="text-[#32CD32]">smart monitoring</span>{" "}
            and{" "}
            <span className="text-[#8A2BE2]">expert training</span>
          </h1>
          
          {/* Sub-heading */}
          <p className="text-sm text-white/90 mb-4 max-w-2xl">
            Professional beekeeping management system for modern beekeepers and commercial operations
          </p>
          
          {/* CTA Button */}
          <div className="flex justify-center mb-4">
            <Link href="/login">
              <Button 
                size="sm" 
                className="bg-white text-black hover:bg-white/90 px-4 py-2 text-sm font-semibold rounded-lg flex items-center gap-2 cursor-pointer"
              > 
                Start Your Journey
                <ArrowRight className="h-3 w-3" />
              </Button>
            </Link>
          </div>
          
          {/* Images Section */}
          <div className="grid md:grid-cols-2 gap-4 max-w-2xl mx-auto">
            <div className="text-center">
              <img 
                src="/a.jpeg" 
                alt="Image A" 
                className="w-full h-32 object-cover rounded-lg transition-all duration-300 hover:brightness-110 hover:sepia hover:contrast-125 hover:scale-105 cursor-pointer"
                style={{
                  filter: 'none'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.filter = 'sepia(1) hue-rotate(30deg) saturate(1.5) brightness(1.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.filter = 'none';
                }}
              />
            </div>
            <div className="text-center">
              <img 
                src="/b.jpeg" 
                alt="Image B" 
                className="w-full h-32 object-cover rounded-lg transition-all duration-300 hover:brightness-110 hover:sepia hover:contrast-125 hover:scale-105 cursor-pointer"
                style={{
                  filter: 'none'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.filter = 'sepia(1) hue-rotate(30deg) saturate(1.5) brightness(1.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.filter = 'none';
                }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="header-bg border-t border-white/20">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Hexagon className="h-4 w-4 text-white" />
              <span className="text-sm text-white">© 2025 Smart Hive Solutions</span>
            </div>
            <div className="flex items-center gap-4">
              <Link href="#" className="text-xs text-white/80 hover:text-white transition-colors">Privacy</Link>
              <Link href="#" className="text-xs text-white/80 hover:text-white transition-colors">Terms</Link>
              <Link href="#" className="text-xs text-white/80 hover:text-white transition-colors">Support</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

'use client'

import Link from 'next/link'
import { Facebook, Twitter, Instagram, Mail, Phone, MapPin } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="bg-black border-t border-gray-800">
      <div className="container mx-auto px-4 md:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo and Description */}
          <div className="space-y-4">
            <Link href="/" className="flex items-center space-x-2">
              <span className="text-2xl font-bold text-white whitespace-nowrap">
                <span className="text-[#E2FF1B]">3gen</span> Padel Academy
              </span>
            </Link>
            <p className="text-gray-400">
              La mejor academia de pádel. Únete a nuestra comunidad y mejora tu juego con los mejores profesores.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Enlaces Rápidos</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/" className="text-gray-400 hover:text-[#E2FF1B] transition-colors">
                  Inicio
                </Link>
              </li>
              <li>
                <Link href="/inscripciones" className="text-gray-400 hover:text-[#E2FF1B] transition-colors">
                  Ligas
                </Link>
              </li>
              <li>
                <Link href="/academia" className="text-gray-400 hover:text-[#E2FF1B] transition-colors">
                  Academia
                </Link>
              </li>
              <li>
                <Link href="/rankings" className="text-gray-400 hover:text-[#E2FF1B] transition-colors">
                  Rankings
                </Link>
              </li>
              <li>
                <Link href="/merchandising" className="text-gray-400 hover:text-[#E2FF1B] transition-colors">
                  Merchandising
                </Link>
              </li>
              <li>
                <Link href="/quienes-somos" className="text-gray-400 hover:text-[#E2FF1B] transition-colors">
                  Quiénes somos
                </Link>
              </li>
              <li>
                <Link href="/contacto" className="text-gray-400 hover:text-[#E2FF1B] transition-colors">
                  Contacto
                </Link>
              </li>
              <li>
                <a 
                  href="https://atcsports.io/venues/normanda-caba" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-gray-400 hover:text-[#E2FF1B] transition-colors"
                >
                  Sedes
                </a>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Contacto</h3>
            <ul className="space-y-3">
              <li className="flex items-center space-x-2">
                <MapPin className="h-5 w-5 text-[#E2FF1B]" />
                <a 
                  href="https://g.co/kgs/FFU53qm" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-[#E2FF1B] transition-colors"
                >
                  Delgado 864, Colegiales, CABA
                </a>
              </li>
              <li className="flex items-center space-x-2">
                <Phone className="h-5 w-5 text-[#E2FF1B]" />
                <a 
                  href="https://wa.me/5491135921988" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-[#E2FF1B] transition-colors"
                >
                  +54 9 11 3592-1988
                </a>
              </li>
              <li className="flex items-center space-x-2">
                <Phone className="h-5 w-5 text-[#E2FF1B]" />
                <a 
                  href="https://wa.me/5491149285316" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-[#E2FF1B] transition-colors"
                >
                  +54 9 11 4928-5316
                </a>
              </li>
              <li className="flex items-center space-x-2">
                <Phone className="h-5 w-5 text-[#E2FF1B]" />
                <a 
                  href="https://wa.me/5491132673029" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-[#E2FF1B] transition-colors"
                >
                  +54 9 11 3267-3029
                </a>
              </li>
              <li className="flex items-center space-x-2">
                <Mail className="h-5 w-5 text-[#E2FF1B]" />
                <a 
                  href="mailto:tresgenpadel@hotmail.com" 
                  className="text-gray-400 hover:text-[#E2FF1B] transition-colors"
                >
                  tresgenpadel@hotmail.com
                </a>
              </li>
            </ul>
          </div>

          {/* Social Media */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Síguenos</h3>
            <div className="flex space-x-4">
              <Link
                href="https://www.instagram.com/3genpadel/" target="_blank" rel="noopener noreferrer"
                className="p-2 bg-gray-800 rounded-full text-gray-400 hover:text-[#E2FF1B] hover:bg-gray-700 transition-colors"
              >
                <Instagram className="h-5 w-5" />
              </Link>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-12 pt-8 border-t border-gray-800 text-center text-gray-400">
          <p>© {new Date().getFullYear()} 3gen Padel Academy. Todos los derechos reservados.</p>
        </div>
      </div>
    </footer>
  )
} 
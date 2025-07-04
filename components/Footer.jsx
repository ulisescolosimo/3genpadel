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
              La mejor plataforma para torneos de pádel. Únete a nuestra comunidad y comienza a competir.
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
                <Link href="/torneos" className="text-gray-400 hover:text-[#E2FF1B] transition-colors">
                  Torneos
                </Link>
              </li>
              <li>
                <Link href="/merchandising" className="text-gray-400 hover:text-[#E2FF1B] transition-colors">
                  Merchandising
                </Link>
              </li>
              <li>
                <Link href="/profesores-expertos" className="text-gray-400 hover:text-[#E2FF1B] transition-colors">
                  Profesores Expertos
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
                <span className="text-gray-400">Delgado 864, Colegiales, CABA</span>
              </li>
              <li className="flex items-center space-x-2">
                <Phone className="h-5 w-5 text-[#E2FF1B]" />
                <span className="text-gray-400">+54 11 4781-1234</span>
              </li>
              <li className="flex items-center space-x-2">
                <Mail className="h-5 w-5 text-[#E2FF1B]" />
                <span className="text-gray-400">info@lanormanda.com</span>
              </li>
            </ul>
          </div>

          {/* Social Media */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Síguenos</h3>
            <div className="flex space-x-4">
              <Link
                href="#"
                className="p-2 bg-gray-800 rounded-full text-gray-400 hover:text-[#E2FF1B] hover:bg-gray-700 transition-colors"
              >
                <Facebook className="h-5 w-5" />
              </Link>
              <Link
                href="#"
                className="p-2 bg-gray-800 rounded-full text-gray-400 hover:text-[#E2FF1B] hover:bg-gray-700 transition-colors"
              >
                <Twitter className="h-5 w-5" />
              </Link>
              <Link
                href="#"
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
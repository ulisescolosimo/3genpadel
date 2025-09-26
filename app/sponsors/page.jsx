"use client"

import { motion } from "framer-motion"
import { ArrowRight, Users, Star, Award, Heart } from "lucide-react"
import Link from "next/link"

export default function SponsorsPage() {
  return (
    <div className="flex flex-col min-h-screen bg-black">
      {/* Hero Section */}
      <section className="flex flex-col items-center justify-center py-16 md:py-20 bg-gradient-to-b from-black via-gray-900 to-gray-800">
        <div className="container mx-auto px-4 md:px-6 max-w-7xl">
          <div className="flex flex-col items-center space-y-6 text-center">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="space-y-4"
            >
              <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl">
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-white via-[#E2FF1B] to-white animate-gradient-x">
                  Nuestros Sponsors
                </span>
              </h1>
              <p className="max-w-[600px] text-gray-200 md:text-xl mx-auto">
                Conocé a las marcas que nos acompañan en este camino y forman parte de la familia 3gen Padel Academy
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Sponsors Section */}
      <section className="flex flex-col items-center py-8 md:py-8 bg-gradient-to-b from-gray-800 via-gray-800 to-gray-900">
        <div className="container mx-auto px-4 md:px-6 max-w-7xl flex flex-col gap-8">
          {/* Sponsors Grid */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="mb-8"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
              {[
                { image: '/images/sponsors/1.jpg', url: 'https://www.instagram.com/odpropadel?igsh=ejNkdm0yZjlxcjZk' },
                { image: '/images/sponsors/2.jpg', url: 'https://www.instagram.com/3genpadel/' },
                { image: '/images/sponsors/3.jpg', url: 'https://www.instagram.com/dosparedes?igsh=MWNpbnJxMjE5NGc3Yw==' },
                { image: '/images/sponsors/4.jpg', url: 'https://www.gamepropadel.com.ar/' },
                { image: '/images/sponsors/5.jpg', url: 'https://www.instagram.com/lanormandapadel?igsh=MW4yYjh4b2V6ZG8zZQ==' },
                { image: '/images/sponsors/6.jpg', url: 'https://backtopadel.com.ar/' }
              ].map((sponsor, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: 0.3 + index * 0.1 }}
                  className="group"
                >
                  <a 
                    href={sponsor.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="block"
                  >
                    <div className="sponsor-card relative w-full h-48 md:h-56 bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700/50 hover:border-[#E2FF1B]/30 transition-all duration-300 hover:transform hover:scale-105 hover:shadow-2xl hover:shadow-[#E2FF1B]/10 overflow-hidden">
                      <img
                        src={sponsor.image}
                        alt={`Sponsor ${index + 1}`}
                        className="w-full h-full object-contain p-6 group-hover:scale-110 transition-transform duration-500 rounded-lg"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    </div>
                  </a>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Call to Action */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="flex justify-center"
          >
            <div className="bg-gradient-to-r from-gray-900/50 to-gray-800/50 backdrop-blur-sm rounded-2xl p-8 border border-gray-700/50">
              <h3 className="text-2xl font-bold text-white mb-4 text-center">
                ¿Querés ser parte de nuestra familia de sponsors?
              </h3>
              <p className="text-gray-400 mb-6 max-w-2xl mx-auto text-center">
                Únete a las marcas que creen en el crecimiento del padel y quieren formar parte de nuestro proyecto. 
                Contactanos para conocer las oportunidades de patrocinio disponibles.
              </p>
              <div className="flex justify-center">
                <a 
                  href="https://wa.me/5491167617557?text=Hola! Me interesa ser sponsor de 3gen Padel Academy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-2 bg-gradient-to-r from-[#E2FF1B]/20 to-[#E2FF1B]/10 rounded-full px-6 py-3 border border-[#E2FF1B]/30 hover:from-[#E2FF1B]/30 hover:to-[#E2FF1B]/20 transition-all duration-300 cursor-pointer group"
                >
                  <span className="text-[#E2FF1B] text-sm font-medium group-hover:scale-105 transition-transform duration-300">
                    Contactanos por WhatsApp
                  </span>
                  <ArrowRight className="h-4 w-4 text-[#E2FF1B] group-hover:translate-x-1 transition-transform duration-300" />
                </a>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="flex flex-col items-center justify-center py-16 md:py-24 bg-gradient-to-b from-gray-900 via-gray-900 to-black">
        <div className="container mx-auto px-4 md:px-6 max-w-7xl">
          <div className="flex flex-col items-center space-y-8 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="space-y-6"
            >
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tighter">
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-white via-[#E2FF1B] to-white animate-gradient-x">
                  ¡Trabajemos juntos!
                </span>
              </h2>
              <p className="max-w-[600px] text-gray-200 md:text-xl mx-auto">
                Formá parte de la revolución del padel en Argentina junto a 3gen Padel Academy
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <Link href="/academia">
                <button className="group relative px-6 py-4 text-base font-medium bg-transparent text-[#E2FF1B] border-2 border-[#E2FF1B] rounded-xl transition-all duration-300 hover:text-black overflow-hidden">
                  <span className="relative z-10 flex items-center gap-2">
                    <Heart className="h-4 w-4 text-[#E2FF1B] group-hover:text-black transition-colors duration-300" />
                    Conocé nuestra academia
                    <ArrowRight className="h-4 w-4 text-[#E2FF1B] group-hover:text-black group-hover:translate-x-1 transition-all duration-300" />
                  </span>
                  <div className="absolute inset-0 bg-[#E2FF1B]/5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="absolute inset-0 bg-[#E2FF1B] rounded-xl translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out"></div>
                </button>
              </Link>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  )
}

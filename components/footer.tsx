"use client";

import { motion } from "framer-motion";
import { Facebook, Instagram, Twitter, Mail, Phone, MapPin, Leaf } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default function Footer() {
  return (
    <footer className="relative bg-gradient-to-b from-[#f5f5f0] via-[#f8f8f3] to-[#fafaf5] mt-20">
      {/* Decorative top border - subtle gradient */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-green-200/50 to-transparent"></div>
      
      {/* Subtle pattern overlay */}
      <div 
        className="absolute inset-0 opacity-[0.02]" 
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }}
      ></div>
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16 max-w-[1920px] py-16 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {/* Company Info Column */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="lg:col-span-1"
          >
            <div className="flex items-center space-x-3 mb-6">
              <motion.div
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 0.2 }}
                className="relative h-16 w-16 rounded-full bg-white border border-green-100 flex items-center justify-center shadow-xl hover:shadow-2xl transition-shadow duration-300 overflow-hidden"
              >
                <Image src="/icons/dakshamani_logo.png" alt="Dakshamani Logo" width={64} height={64} className="object-contain p-1" />
              </motion.div>
              <h3 className="text-2xl font-bold text-gray-900 tracking-tight">
                Dakshamani
              </h3>
            </div>
            <p className="text-gray-600 text-[15px] leading-relaxed mb-6 font-light">
              Your trusted source for premium dry fruits, masalas, sweets, and
              natural products.
            </p>
            <div className="flex space-x-4">
              <motion.a
                href="#"
                whileHover={{ scale: 1.1, y: -2 }}
                whileTap={{ scale: 0.95 }}
                className="h-10 w-10 rounded-full bg-white/80 backdrop-blur-sm border border-gray-200 flex items-center justify-center text-gray-600 hover:text-green-600 hover:border-green-300 transition-all duration-300 shadow-sm hover:shadow-md"
              >
                <Facebook className="h-4 w-4" />
              </motion.a>
              <motion.a
                href="#"
                whileHover={{ scale: 1.1, y: -2 }}
                whileTap={{ scale: 0.95 }}
                className="h-10 w-10 rounded-full bg-white/80 backdrop-blur-sm border border-gray-200 flex items-center justify-center text-gray-600 hover:text-green-600 hover:border-green-300 transition-all duration-300 shadow-sm hover:shadow-md"
              >
                <Instagram className="h-4 w-4" />
              </motion.a>
              <motion.a
                href="#"
                whileHover={{ scale: 1.1, y: -2 }}
                whileTap={{ scale: 0.95 }}
                className="h-10 w-10 rounded-full bg-white/80 backdrop-blur-sm border border-gray-200 flex items-center justify-center text-gray-600 hover:text-green-600 hover:border-green-300 transition-all duration-300 shadow-sm hover:shadow-md"
              >
                <Twitter className="h-4 w-4" />
              </motion.a>
            </div>
          </motion.div>

          {/* Quick Links Column */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <h4 className="text-lg font-semibold text-gray-900 mb-6 tracking-tight">Quick Links</h4>
            <ul className="space-y-3">
              {[
                { href: "/", label: "Home" },
                { href: "/products", label: "Products" },
                { href: "/about", label: "About Us" },
                { href: "/contact", label: "Contact" },
              ].map((link, index) => (
                <motion.li
                  key={link.href}
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.3, delay: 0.1 + index * 0.05 }}
                >
                  <Link
                    href={link.href}
                    className="text-gray-600 hover:text-green-600 text-[15px] font-light transition-colors duration-300 relative group"
                  >
                    <span className="relative">
                      {link.label}
                      <span className="absolute bottom-0 left-0 w-0 h-[1px] bg-green-600 group-hover:w-full transition-all duration-300"></span>
                    </span>
                  </Link>
                </motion.li>
              ))}
            </ul>
          </motion.div>

          {/* Categories Column */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <h4 className="text-lg font-semibold text-gray-900 mb-6 tracking-tight">Categories</h4>
            <ul className="space-y-3">
              {[
                { href: "/products?category=dry_fruits", label: "Dry Fruits" },
                { href: "/products?category=masalas", label: "Masalas" },
                { href: "/products?category=sweets", label: "Sweets" },
                { href: "/products?category=other", label: "Other Products" },
              ].map((link, index) => (
                <motion.li
                  key={link.href}
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.3, delay: 0.2 + index * 0.05 }}
                >
                  <Link
                    href={link.href}
                    className="text-gray-600 hover:text-green-600 text-[15px] font-light transition-colors duration-300 relative group"
                  >
                    <span className="relative">
                      {link.label}
                      <span className="absolute bottom-0 left-0 w-0 h-[1px] bg-green-600 group-hover:w-full transition-all duration-300"></span>
                    </span>
                  </Link>
                </motion.li>
              ))}
            </ul>
          </motion.div>

          {/* Contact Us - Business Card Design */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="lg:col-span-1"
          >
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-gray-200/50 hover:shadow-xl transition-all duration-300 relative overflow-hidden group">
              {/* Decorative corner accent */}
              <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-green-500/10 to-transparent rounded-bl-full"></div>
              
              {/* Logo in business card */}
              <div className="flex items-center space-x-3 mb-6 relative z-10">
                <div className="relative h-14 w-14 rounded-full bg-white border border-green-100 flex items-center justify-center shadow-xl overflow-hidden">
                  <Image src="/icons/dakshamani_logo.png" alt="Dakshamani Logo" width={56} height={56} className="object-contain p-1" />
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 tracking-tight">Contact Us</h4>
                  <p className="text-xs text-gray-500 font-light">Get in touch</p>
                </div>
              </div>
              
              <ul className="space-y-4 relative z-10">
                <motion.li
                  initial={{ opacity: 0, x: 10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.3, delay: 0.4 }}
                  className="flex items-start space-x-3 group/item"
                >
                  <div className="flex-shrink-0 h-9 w-9 rounded-lg bg-green-50 flex items-center justify-center group-hover/item:bg-green-100 transition-colors duration-300">
                    <Phone className="h-4 w-4 text-green-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-500 font-light mb-0.5">Phone</p>
                    <a
                      href="tel:+91XXXXXXXXXX"
                      className="text-gray-900 text-sm font-medium hover:text-green-600 transition-colors duration-300 block"
                    >
                      +91 XXXXX XXXXX
                    </a>
                  </div>
                </motion.li>
                
                <motion.li
                  initial={{ opacity: 0, x: 10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.3, delay: 0.45 }}
                  className="flex items-start space-x-3 group/item"
                >
                  <div className="flex-shrink-0 h-9 w-9 rounded-lg bg-green-50 flex items-center justify-center group-hover/item:bg-green-100 transition-colors duration-300">
                    <Mail className="h-4 w-4 text-green-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-500 font-light mb-0.5">Email</p>
                    <a
                      href="mailto:info@dakshamani.com"
                      className="text-gray-900 text-sm font-medium hover:text-green-600 transition-colors duration-300 block break-all"
                    >
                      info@dakshamani.com
                    </a>
                  </div>
                </motion.li>
                
                <motion.li
                  initial={{ opacity: 0, x: 10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.3, delay: 0.5 }}
                  className="flex items-start space-x-3 group/item"
                >
                  <div className="flex-shrink-0 h-9 w-9 rounded-lg bg-green-50 flex items-center justify-center group-hover/item:bg-green-100 transition-colors duration-300">
                    <MapPin className="h-4 w-4 text-green-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-500 font-light mb-0.5">Address</p>
                    <p className="text-gray-900 text-sm font-medium leading-relaxed">
                      Dakshamani Naturo Food Pvt LTD
                    </p>
                  </div>
                </motion.li>
              </ul>
            </div>
          </motion.div>
        </div>

        {/* Copyright Section - Elegant Separator */}
        <div className="mt-16 pt-8 border-t border-gray-200/60 relative">
          {/* Decorative line with gradient */}
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-24 h-px bg-gradient-to-r from-transparent via-green-300/50 to-transparent"></div>
          
          <div className="text-center">
            <p className="text-gray-500 text-sm font-light">
              &copy; 2024 Dakshamani Naturo Food Pvt LTD. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}

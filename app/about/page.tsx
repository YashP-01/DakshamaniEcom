"use client";

import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import { motion } from "framer-motion";
import { Separator } from "@/components/ui/separator";
import {
  Heart,
  Award,
  Leaf,
  Users,
  ShieldCheck,
  Sprout,
  Globe,
  HeartHandshake,
  Recycle,
  Truck,
  FlaskConical,
  Building2,
  GraduationCap,
  Sparkles,
} from "lucide-react";

export default function AboutPage() {
  function SectionHeader({
    eyebrow,
    title,
    description,
  }: {
    eyebrow?: string;
    title: string;
    description?: string;
  }) {
    return (
      <div className="mb-8 md:mb-10">
        {eyebrow ? (
          <div className="text-xs font-semibold uppercase tracking-wider text-green-700/80 mb-2">
            {eyebrow}
          </div>
        ) : null}
        <h2 className="text-2xl md:text-3xl font-semibold text-gray-900">{title}</h2>
        {description ? (
          <p className="text-gray-600 text-sm md:text-base mt-2 max-w-3xl">
            {description}
          </p>
        ) : null}
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-[#f5f5f0]">
      <Navbar />
      <div className="pt-40 pb-16 md:pt-48 md:pb-20 lg:pt-56 lg:pb-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 2xl:px-16 max-w-[1920px]">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-12 md:mb-16"
          >
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">About Dakshamani Naturo Food</h1>
            <p className="text-base sm:text-lg md:text-xl text-gray-600 max-w-2xl mx-auto">
              Your trusted source for premium natural products, dry fruits, masalas, and sweets
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 mb-12 md:mb-16">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <h2 className="text-2xl sm:text-3xl font-bold mb-4">Our Story</h2>
              <p className="text-gray-600 leading-relaxed text-sm sm:text-base">
                Dakshamani Naturo Food Pvt LTD was founded with a mission to provide
                high-quality, natural products to health-conscious consumers. We source
                the finest dry fruits, masalas, sweets, and other natural products
                directly from trusted suppliers.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <h2 className="text-2xl sm:text-3xl font-bold mb-4">Our Mission</h2>
              <p className="text-gray-600 leading-relaxed text-sm sm:text-base">
                To promote healthy living by offering pure, natural, and organic products
                that are free from harmful chemicals and preservatives. We are committed
                to quality, freshness, and customer satisfaction.
              </p>
            </motion.div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {[
              { icon: Leaf, title: "100% Natural", description: "Pure and organic products" },
              { icon: Award, title: "Premium Quality", description: "Finest selection guaranteed" },
              { icon: Heart, title: "Health First", description: "Your wellbeing is our priority" },
              { icon: Users, title: "Customer Care", description: "24/7 support available" },
            ].map((item, index) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1, duration: 0.5 }}
                  className="text-center p-4 sm:p-6 bg-gray-50 rounded-lg hover:bg-green-50 transition-colors duration-300"
                >
                  <Icon className="h-10 w-10 sm:h-12 sm:w-12 text-green-600 mx-auto mb-4" />
                  <h3 className="font-semibold text-base sm:text-lg mb-2">{item.title}</h3>
                  <p className="text-gray-600 text-xs sm:text-sm">{item.description}</p>
                </motion.div>
              );
            })}
          </div>

          <Separator className="my-10 md:my-12" />

          <motion.section
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-12 md:mt-16"
          >
            <SectionHeader
              eyebrow="Why Dakshamani"
              title="Why customers choose us"
              description="Inspired by leading natural food marketplaces, we focus on transparency, innovation, and care in every order."
            />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                {
                  icon: ShieldCheck,
                  title: "Lab-Tested Purity",
                  description:
                    "Independent laboratories verify every batch for adulterants, ensuring safety standards rival top organic brands.",
                },
                {
                  icon: Sprout,
                  title: "Farm Partnerships",
                  description:
                    "We work directly with sustainable farms and artisan cooperatives to preserve heritage crops and fair pricing.",
                },
                {
                  icon: Globe,
                  title: "Pan-India Fresh Logistics",
                  description:
                    "Cold-chain enabled dispatches guarantee freshness, matching experiences you see on premium wellness platforms.",
                },
              ].map((item, index) => {
                const Icon = item.icon;
                return (
                  <motion.div
                    key={item.title}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.15, duration: 0.6 }}
                    className="p-6 bg-white shadow-sm rounded-xl border border-gray-100 hover:shadow-md transition-shadow"
                  >
                    <Icon className="h-10 w-10 text-green-600 mb-4" />
                    <h3 className="text-lg sm:text-xl font-semibold mb-3">{item.title}</h3>
                    <p className="text-gray-600 text-sm sm:text-base leading-relaxed">{item.description}</p>
                  </motion.div>
                );
              })}
            </div>
          </motion.section>

          <Separator className="my-10 md:my-12" />

          <motion.section
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-12 md:mt-16 bg-green-50/60 rounded-3xl p-6 sm:p-10"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center">
              <div>
                <SectionHeader
                  eyebrow="Transparency"
                  title="Seed-to-table, explained simply"
                  description="From harvest to your pantry, we document each milestone with a lightweight, easy-to-scan traceability framework."
                />
                <div className="space-y-4">
                  {[
                    {
                      step: "Harvest & Selection",
                      description:
                        "Partner farmers follow regenerative practices, with soil health audits every season.",
                    },
                    {
                      step: "Cold Processing",
                      description:
                        "Low-temperature dehydration and stone-grinding preserve nutrition without additives.",
                    },
                    {
                      step: "Quality Lock",
                      description:
                        "ISO 22000 and FSSAI-compliant facilities seal freshness using food-grade, eco-friendly packs.",
                    },
                    {
                      step: "Real-Time Tracking",
                      description:
                        "Every order carries a QR code linking batch tests, best-before guidance, and recipe ideas.",
                    },
                  ].map((item, index) => (
                    <div key={item.step} className="flex items-start gap-4">
                      <div className="flex-none w-10 h-10 rounded-full bg-white text-green-600 font-semibold flex items-center justify-center shadow-sm">
                        {index + 1}
                      </div>
                      <div>
                        <h3 className="font-semibold text-base sm:text-lg">{item.step}</h3>
                        <p className="text-gray-600 text-xs sm:text-sm leading-relaxed">{item.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-green-100">
                <h3 className="text-lg sm:text-xl font-semibold mb-4">Quality Assurances</h3>
                <ul className="space-y-4">
                  {[
                    { icon: HeartHandshake, label: "Ethical Sourcing Contracts" },
                    { icon: Recycle, label: "100% Recyclable Packaging" },
                    { icon: FlaskConical, label: "Every Lot Nutritional Profiling" },
                    { icon: Truck, label: "48-Hour Dispatch from Climatised Hubs" },
                  ].map((item) => {
                    const Icon = item.icon;
                    return (
                      <li key={item.label} className="flex items-center gap-3 text-sm sm:text-base text-gray-700">
                        <Icon className="h-5 w-5 text-green-600" />
                        <span>{item.label}</span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>
          </motion.section>

          <Separator className="my-10 md:my-12" />

          <motion.section
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mt-12 md:mt-16"
          >
            <SectionHeader
              eyebrow="Assurance"
              title="Certifications & collaborations"
              description="Benchmarking global organic retailers, we invest in rigorous certifications that protect your family’s nutrition."
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { title: "FSSAI & ISO 22000", description: "Food safety management certified for all facilities." },
                { title: "USDA Organic Alliances", description: "Select ranges meet USDA organic equivalence standards." },
                { title: "NABL Lab Partners", description: "Periodic audits with accredited Indian labs." },
                { title: "Farm Collective Network", description: "45+ smallholders empowered via long-term contracts." },
              ].map((item, index) => (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1, duration: 0.5 }}
                  className="p-6 border border-gray-200 rounded-xl bg-white text-center hover:border-green-200 transition-colors"
                >
                  <Sparkles className="h-8 w-8 text-green-600 mx-auto mb-4" />
                  <h3 className="font-semibold text-base sm:text-lg mb-2">{item.title}</h3>
                  <p className="text-gray-600 text-xs sm:text-sm leading-relaxed">{item.description}</p>
                </motion.div>
              ))}
            </div>
          </motion.section>

          <Separator className="my-10 md:my-12" />

          <motion.section
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="mt-12 md:mt-16"
          >
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-1 bg-green-600 text-white rounded-3xl p-6 sm:p-8">
                <h2 className="text-2xl sm:text-3xl font-semibold mb-4">Impact snapshot</h2>
                <p className="text-sm sm:text-base text-green-50">
                  We measured ourselves against leading conscious commerce players and set ambitious benchmarks.
                </p>
              </div>
              <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6">
                {[
                  { value: "37%", label: "Repeat customers choose subscription refills every month." },
                  { value: "62", label: "Communities receiving livelihood support and agronomy training." },
                  { value: "12k+", label: "Plastic-free shipments delivered using compostable fillers." },
                  { value: "4.8/5", label: "Average customer rating across marketplaces and retail counters." },
                ].map((item, index) => (
                  <motion.div
                    key={item.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1, duration: 0.5 }}
                    className="p-6 border border-gray-200 rounded-2xl bg-white hover:shadow-md transition-shadow"
                  >
                    <div className="text-3xl font-bold text-green-600 mb-2">{item.value}</div>
                    <p className="text-gray-600 text-sm sm:text-base leading-relaxed">{item.label}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.section>

          <Separator className="my-10 md:my-12" />

          <motion.section
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="mt-12 md:mt-16"
          >
            <SectionHeader
              eyebrow="Our Team"
              title="Leadership & advisory"
              description="Nutritionists, food technologists, and supply-chain specialists guide our product roadmap to stay ahead of industry benchmarks."
            />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                {
                  name: "Anita Rao",
                  role: "Founder & Chief Nutrition Officer",
                  description:
                    "Certified dietician with two decades of experience curating plant-forward diets for Indian families.",
                  icon: Building2,
                },
                {
                  name: "Mukesh Sharma",
                  role: "Director - Supply Chain",
                  description:
                    "Former Amazon Fresh operations lead, bringing cold-chain expertise to preserve taste and texture.",
                  icon: Truck,
                },
                {
                  name: "Dr. Kavya Iyer",
                  role: "Food Science Advisor",
                  description:
                    "PhD in Food Technology, consults on wellness brands across Asia to ensure science-backed product launches.",
                  icon: GraduationCap,
                },
              ].map((member, index) => {
                const Icon = member.icon;
                return (
                  <motion.div
                    key={member.name}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1, duration: 0.5 }}
                    className="p-6 border border-gray-200 rounded-2xl bg-white hover:shadow-md transition-shadow"
                  >
                    <Icon className="h-10 w-10 text-green-600 mb-4" />
                    <h3 className="text-lg sm:text-xl font-semibold mb-1">{member.name}</h3>
                    <p className="text-sm text-green-600 mb-3">{member.role}</p>
                    <p className="text-gray-600 text-sm sm:text-base leading-relaxed">{member.description}</p>
                  </motion.div>
                );
              })}
            </div>
          </motion.section>

          <Separator className="my-10 md:my-12" />

          <motion.section
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.7 }}
            className="mt-12 md:mt-16 bg-gray-900 text-white rounded-3xl p-6 sm:p-10"
          >
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div>
                <h2 className="text-2xl sm:text-3xl font-semibold mb-3">Experience Dakshamani beyond the screen</h2>
                <p className="text-sm sm:text-base text-gray-200 max-w-2xl">
                  Join tasting sessions at our wellness studios, explore dietician-crafted hampers, or set up corporate
                  gifting with provenance guarantees. We are continuously introducing experiential offerings inspired by
                  leading gourmet brands.
                </p>
              </div>
              <motion.a
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.2 }}
                href="/contact"
                className="inline-flex items-center justify-center px-5 py-3 bg-green-500 text-white font-semibold rounded-full hover:bg-green-400 transition-colors"
              >
                Plan a Visit
              </motion.a>
            </div>
          </motion.section>
        </div>
      </div>
      <Footer />
    </div>
  );
}


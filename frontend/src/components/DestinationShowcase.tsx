import { motion } from 'framer-motion';
import { Star, MapPin } from 'lucide-react';

interface Destination {
  id: number;
  name: string;
  country: string;
  image: string;
  rating: number;
  price: number;
  description: string;
}

const destinations: Destination[] = [
  {
    id: 1,
    name: "Paris",
    country: "France",
    image: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800",
    rating: 4.9,
    price: 128,
    description: "Romantic escapes, art, and cafés"
  },
  {
    id: 2,
    name: "Santorini",
    country: "Greece",
    image: "https://images.unsplash.com/photo-1613395877344-13d4a8e0d49e?w=800",
    rating: 4.8,
    price: 225,
    description: "Sunsets, sea views, and serenity"
  },
  {
    id: 3,
    name: "Bali",
    country: "Indonesia",
    image: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=800",
    rating: 4.7,
    price: 86,
    description: "Beaches, nature, and calm vibes"
  },
  {
    id: 4,
    name: "Kyoto",
    country: "Japan",
    image: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=800",
    rating: 4.9,
    price: 190,
    description: "Cherry blossoms and temples"
  }
];

export default function DestinationShowcase() {
  return (
    <div className="py-12">
      <div className="mb-8">
        <h2 className="text-4xl font-bold text-slate-800 mb-2">Trending Destinations</h2>
        <p className="text-slate-600">Discover the most popular places to visit</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {destinations.map((dest, index) => (
          <motion.div
            key={dest.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ y: -8, scale: 1.02 }}
            className="group cursor-pointer"
          >
            <div className="relative h-[520px] rounded-2xl overflow-hidden shadow-xl">
              {/* Image with gradient overlay */}
              <img
                src={dest.image}
                alt={dest.name}
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/85" />
              
              {/* Blur card effect */}
              <div className="absolute inset-0 backdrop-blur-[0.5px] bg-gradient-to-t from-white/5 to-transparent" />

              {/* Content */}
              <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                <div className="flex items-center gap-2 mb-2">
                  <MapPin size={18} className="text-yellow-400" />
                  <h3 className="text-3xl font-bold">{dest.name}, {dest.country}</h3>
                </div>
                
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-gray-200">From</span>
                  <span className="text-yellow-400 text-xl font-semibold">${dest.price}</span>
                  <span className="text-gray-200">/night</span>
                </div>

                <p className="text-gray-200 text-sm mb-3">{dest.description}</p>

                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      size={16}
                      className={i < Math.floor(dest.rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-400'}
                    />
                  ))}
                  <span className="ml-2 text-sm text-gray-300">{dest.rating}</span>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

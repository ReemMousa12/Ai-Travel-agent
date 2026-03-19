import { MapPin, Calendar, Users, DollarSign, Shield, FileText, Star, Sparkles, ArrowRight } from 'lucide-react';
import { useState, useEffect } from 'react';
import { apiClient } from '../lib/api';
import type { User } from '../lib/auth';
import type { Destination, Deal } from '../lib/api';
import { FavoriteButton } from './FavoriteButton';

interface Props {
  user: User;
  onNavigateToChat?: (message: string) => void;
}

export default function LandingPage({ user, onNavigateToChat }: Props) {
  const [userLocation, setUserLocation] = useState<string>('');
  const [searchLocation, setSearchLocation] = useState('');
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guests, setGuests] = useState('');
  const [budget, setBudget] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<string>('');
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [isLoadingTrending, setIsLoadingTrending] = useState(false);

  useEffect(() => {
    loadUserLocation();
  }, [user]);

  // Fetch trending destinations and deals when location is available
  useEffect(() => {
    if (userLocation && userLocation !== 'Your area') {
      setIsLoadingTrending(true);
      apiClient.getTrendingData(userLocation)
        .then(data => {
          setDestinations(data.destinations);
          setDeals(data.deals);
        })
        .catch(error => {
          console.error('Failed to fetch trending data:', error);
        })
        .finally(() => {
          setIsLoadingTrending(false);
        });
    }
  }, [userLocation]);

  async function loadUserLocation() {
    try {
      // Try to get user preferences first
      const preferences = await apiClient.getUserPreferences(user.id);
      if (preferences?.locationCity && preferences?.locationCountry) {
        const location = `${preferences.locationCity}, ${preferences.locationCountry}`;
        setUserLocation(location);
        setSearchLocation(location);
      } else {
        // Fallback to IP-based location
        const locationData = await apiClient.getLocation();
        const location = `${locationData.city}, ${locationData.country}`;
        setUserLocation(location);
        setSearchLocation(location);
      }
    } catch (error) {
      console.error('Error loading location:', error);
      setUserLocation('Your area');
    }
  }

  function handleQuickSuggestion() {
    const message = `I need travel suggestions to places near ${userLocation || 'me'} with affordable prices. Please recommend some great destinations with budget-friendly options.`;
    if (onNavigateToChat) {
      onNavigateToChat(message);
    }
  }

  async function handleSearch() {
    if (!searchLocation || !checkIn || !checkOut) {
      alert('Please fill in location and dates to search');
      return;
    }
    
    setIsSearching(true);
    setSearchResults('');
    console.log('Starting search...');
    try {
      // Calculate trip duration
      const start = new Date(checkIn);
      const end = new Date(checkOut);
      const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      
      // Build AI query
      const guestText = guests ? `for ${guests} guests` : '';
      const budgetText = budget ? `with a budget of $${budget} per night` : '';
      const query = `I'm looking for accommodations in ${searchLocation} ${guestText} ${budgetText}. I'll be staying from ${checkIn} to ${checkOut} (${days} days). Please suggest some great options with prices, locations, and what makes them special. Include hotels, villas, or unique stays.`;
      
      console.log('Sending query to AI:', query);
      
      // Call AI agent
      const response = await apiClient.sendChatMessage(query, user.id, user.email);
      
      console.log('AI Response:', response);
      
      if (response.message || response.reply) {
        setSearchResults(response.message || response.reply);
        // Scroll to results
        setTimeout(() => {
          document.getElementById('search-results')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
      } else {
        alert('No results found. Please try again.');
      }
    } catch (error) {
      console.error('Search error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      alert('Sorry, search failed: ' + errorMessage);
    } finally {
      setIsSearching(false);
      console.log('Search completed');
    }
  }

  return (
    <div className="bg-white min-h-screen">
      {/* Quick Suggestion Banner */}
      <div className="bg-blue-600 py-3 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 flex-col sm:flex-row">
          <p className="text-white text-sm sm:text-base font-medium text-center sm:text-left">
            Looking for travel suggestions near {userLocation || 'you'} with affordable prices?
          </p>
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                const newLocation = prompt('Enter your location (City, Country):', userLocation);
                if (newLocation && newLocation.trim()) {
                  setUserLocation(newLocation.trim());
                }
              }}
              className="flex items-center gap-2 bg-white/20 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-white/30 transition-colors whitespace-nowrap"
            >
              <MapPin size={16} />
              <span>Update Location</span>
            </button>
            <button
              onClick={handleQuickSuggestion}
              className="flex items-center gap-2 bg-white text-blue-600 px-5 py-2 rounded-lg text-sm font-semibold hover:bg-blue-50 transition-colors whitespace-nowrap"
            >
              <span>Get AI Suggestions</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-blue-600 to-blue-800 text-white">
        <div className="absolute inset-0 opacity-10">
          <img src="https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=1600" alt="Hero" className="w-full h-full object-cover" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
          <div className="text-center mb-12">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-4">
              Discover Your Next Adventure
            </h1>
            <p className="text-lg sm:text-xl text-blue-100 max-w-2xl mx-auto">
              Find unique stays, plan perfect trips, and create unforgettable memories
            </p>
          </div>

          {/* Search Box */}
          <div className="bg-white rounded-xl shadow-2xl p-6 max-w-5xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-lg border border-gray-200">
                <MapPin className="text-gray-400" size={20} />
                <input 
                  type="text" 
                  placeholder="Where to?" 
                  value={searchLocation}
                  onChange={(e) => setSearchLocation(e.target.value)}
                  className="bg-transparent outline-none flex-1 text-gray-900 placeholder-gray-500" 
                />
              </div>
              <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-lg border border-gray-200">
                <Calendar className="text-gray-400" size={20} />
                <input 
                  type="date" 
                  placeholder="Check-in" 
                  value={checkIn}
                  onChange={(e) => setCheckIn(e.target.value)}
                  className="bg-transparent outline-none flex-1 text-gray-900" 
                />
              </div>
              <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-lg border border-gray-200">
                <Calendar className="text-gray-400" size={20} />
                <input 
                  type="date" 
                  placeholder="Check-out" 
                  value={checkOut}
                  onChange={(e) => setCheckOut(e.target.value)}
                  className="bg-transparent outline-none flex-1 text-gray-900" 
                />
              </div>
              <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-lg border border-gray-200">
                <Users className="text-gray-400" size={20} />
                <input 
                  type="number" 
                  placeholder="Guests" 
                  value={guests}
                  onChange={(e) => setGuests(e.target.value)}
                  min="1"
                  className="bg-transparent outline-none flex-1 text-gray-900 placeholder-gray-500" 
                />
              </div>
            </div>
            <div className="mt-4 flex gap-4">
              <div className="flex-1 flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-lg border border-gray-200">
                <DollarSign className="text-gray-400" size={20} />
                <input 
                  type="number" 
                  placeholder="Budget per night (optional)" 
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  className="bg-transparent outline-none flex-1 text-gray-900 placeholder-gray-500" 
                />
              </div>
              <button 
                onClick={handleSearch}
                disabled={isSearching}
                className="px-8 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSearching ? 'Searching...' : 'Search'}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Search Results */}
      {searchResults && (
        <section id="search-results" className="py-12 px-4 sm:px-6 lg:px-8 bg-gray-50">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-lg shadow-lg p-6 sm:p-8">
              <div className="flex items-start gap-4 mb-6">
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <Sparkles className="text-blue-600" size={20} />
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-gray-900 mb-1">Search Results</h2>
                  <p className="text-gray-600">Based on your search in {searchLocation}</p>
                </div>
                <button
                  onClick={() => setSearchResults('')}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  ×
                </button>
              </div>
              <div className="prose prose-gray max-w-none">
                <div className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                  {searchResults}
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Why Trust Us Section */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">Why Choose Tripto</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: DollarSign, title: "Transparent Pricing", desc: "No hidden fees or surprise charges" },
              { icon: Shield, title: "Secure Booking", desc: "Instant confirmation and secure payments" },
              { icon: FileText, title: "Flexible Cancellation", desc: "Free cancellation on most bookings" },
            ].map((item, idx) => (
              <div
                key={idx}
                className="text-center p-6"
              >
                <div className="w-14 h-14 mx-auto mb-4 rounded-lg bg-blue-100 flex items-center justify-center">
                  <item.icon size={24} className="text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-gray-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trending Destinations */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900">Trending Destinations</h2>
          </div>

          {isLoadingTrending ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-white rounded-lg overflow-hidden shadow-md animate-pulse">
                  <div className="h-48 bg-gray-200"></div>
                  <div className="p-4">
                    <div className="h-5 bg-gray-200 rounded mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded mb-3 w-3/4"></div>
                    <div className="flex justify-between">
                      <div className="h-6 bg-gray-200 rounded w-20"></div>
                      <div className="h-5 bg-gray-200 rounded w-12"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : destinations.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {destinations.map((dest, idx) => (
                <div
                  key={idx}
                  onClick={() => {
                    const message = `Tell me more about ${dest.name}. I'm interested in visiting this destination. What are the top attractions, best time to visit, local cuisine, and travel tips? The average price is around $${dest.price} per night.`;
                    if (onNavigateToChat) {
                      onNavigateToChat(message);
                    }
                  }}
                  className="group cursor-pointer bg-white rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-shadow"
                >
                  <div className="relative h-48 overflow-hidden">
                    <img src={dest.image} alt={dest.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  </div>
                  
                  <div className="p-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{dest.name}</h3>
                    <p className="text-sm text-gray-600 mb-3">{dest.desc}</p>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-1">
                        <span className="text-sm text-gray-600">From</span>
                        <span className="text-lg font-bold text-gray-900">${dest.price}</span>
                        <span className="text-sm text-gray-600">/night</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Star size={14} className="fill-yellow-400 text-yellow-400" />
                        <span className="text-sm font-medium text-gray-900">{dest.rating}</span>
                      </div>
                    </div>
                    <div className="flex justify-end">
                      <FavoriteButton
                        userId={user.id}
                        destination={dest.name}
                        country={dest.name}
                        imageUrl={dest.image}
                        rating={dest.rating}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500">No trending destinations available at the moment.</p>
            </div>
          )}
        </div>
      </section>

      {/* Deals for the Weekend */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">
            Deals Near {userLocation || 'You'}
          </h2>

          {isLoadingTrending ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-white rounded-lg overflow-hidden shadow-md border border-gray-200 animate-pulse">
                  <div className="h-48 bg-gray-200"></div>
                  <div className="p-4">
                    <div className="h-4 bg-gray-200 rounded mb-2 w-16"></div>
                    <div className="h-5 bg-gray-200 rounded mb-1"></div>
                    <div className="h-4 bg-gray-200 rounded mb-3 w-24"></div>
                    <div className="h-6 bg-gray-200 rounded w-28"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : deals.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {deals.map((deal, idx) => (
                <div
                  key={idx}
                  onClick={() => {
                    const message = `Tell me more about ${deal.name} in ${deal.location}. I'm interested in this hotel deal - it's ${deal.rating} stars with ${deal.reviews} reviews, currently priced at $${deal.price} (discounted from $${deal.oldPrice}). What amenities does it offer, what's included, and are there any special packages or activities nearby?`;
                    if (onNavigateToChat) {
                      onNavigateToChat(message);
                    }
                  }}
                  className="bg-white rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow border border-gray-200 cursor-pointer"
                >
                  <div className="relative h-48">
                    <img src={deal.image} alt={deal.name} className="w-full h-full object-cover" />
                    <div className="absolute top-2 right-2 bg-green-600 text-white px-2 py-1 rounded text-xs font-medium">
                      Deal
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="flex items-center gap-1 mb-2">
                      <Star size={14} className="fill-yellow-400 text-yellow-400" />
                      <span className="text-sm font-medium text-gray-900">{deal.rating}</span>
                      <span className="text-xs text-gray-500">({deal.reviews})</span>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">{deal.name}</h3>
                    <p className="text-sm text-gray-600 mb-3">{deal.location}</p>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-gray-400 line-through text-sm">${deal.oldPrice}</span>
                      <span className="text-xl font-bold text-gray-900">${deal.price}</span>
                      <span className="text-sm text-gray-600">/night</span>
                    </div>
                    <div className="flex justify-end">
                      <FavoriteButton
                        userId={user.id}
                        destination={deal.name}
                        country={deal.location}
                        imageUrl={deal.image}
                        rating={deal.rating}
                        type="hotel"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500">No deals available at the moment.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

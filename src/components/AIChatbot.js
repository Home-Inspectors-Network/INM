import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';

const INSPECTION_TYPES = [
  { id: 'home', name: 'Home Inspection', description: 'Comprehensive property inspection' },
  { id: 'termite', name: 'Termite Inspection', description: 'Wood-destroying pest inspection' },
  { id: 'radon', name: 'Radon Testing', description: 'Air quality and radon gas testing' },
  { id: 'mold', name: 'Mold Inspection', description: 'Indoor air quality and mold testing' },
  { id: 'commercial', name: 'Commercial Inspection', description: 'Commercial property inspection' },
  { id: 'prelisting', name: 'Pre-listing Inspection', description: 'Seller\'s pre-market inspection' },
  { id: 'warranty', name: 'Warranty Inspection', description: 'New construction warranty inspection' },
  { id: 'specialty', name: 'Specialty Inspection', description: 'Pool, septic, well, or other specialty' }
];

const CONVERSATION_STATES = {
  GREETING: 'greeting',
  LOCATION_REQUEST: 'location_request',
  LOCATION_DETECTING: 'location_detecting',
  INSPECTION_TYPE: 'inspection_type',
  SEARCHING: 'searching',
  RESULTS: 'results',
  HELP: 'help'
};

export default function AIChatbot({ onClose, className = "" }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [currentState, setCurrentState] = useState(CONVERSATION_STATES.GREETING);
  const [userLocation, setUserLocation] = useState(null);
  const [selectedInspectionType, setSelectedInspectionType] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [userInput, setUserInput] = useState('');
  const messagesEndRef = useRef(null);
  const router = useRouter();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      // Initialize conversation
      setTimeout(() => {
        addBotMessage("Hi, how can I help you today? What kind of inspection do you need?");
        setCurrentState(CONVERSATION_STATES.INSPECTION_TYPE);
      }, 500);
    }
  }, [isOpen]);

  const addBotMessage = (text, options = null, showTyping = true) => {
    if (showTyping) {
      setIsTyping(true);
      setTimeout(() => {
        setIsTyping(false);
        setMessages(prev => [...prev, { 
          id: Date.now(), 
          text, 
          sender: 'bot', 
          timestamp: new Date(),
          options 
        }]);
      }, 1000 + Math.random() * 1000); // Simulate typing delay
    } else {
      setMessages(prev => [...prev, { 
        id: Date.now(), 
        text, 
        sender: 'bot', 
        timestamp: new Date(),
        options 
      }]);
    }
  };

  const addUserMessage = (text) => {
    setMessages(prev => [...prev, { 
      id: Date.now(), 
      text, 
      sender: 'user', 
      timestamp: new Date() 
    }]);
  };

  const detectLocation = () => {
    if ('geolocation' in navigator) {
      setCurrentState(CONVERSATION_STATES.LOCATION_DETECTING);
      addBotMessage("Let me detect your location to find inspectors near you...", null, false);
      
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          
          // Reverse geocode to get city name
          try {
            const response = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`);
            const data = await response.json();
            
            if (data.results && data.results.length > 0) {
              const addressComponents = data.results[0].address_components;
              const city = addressComponents.find(comp => comp.types.includes('locality'))?.long_name;
              const state = addressComponents.find(comp => comp.types.includes('administrative_area_level_1'))?.short_name;
              
              setUserLocation({ 
                latitude, 
                longitude, 
                city: city || 'your area', 
                state: state || '',
                fullAddress: data.results[0].formatted_address 
              });
              
              addBotMessage(`Great! I found you in ${city || 'your area'}${state ? `, ${state}` : ''}. Now I can search for local inspectors for you.`);
              proceedWithSearch({ latitude, longitude, city, state });
            }
          } catch (error) {
            console.error('Geocoding error:', error);
            setUserLocation({ latitude, longitude, city: 'your area' });
            addBotMessage("I detected your location. Now let me search for inspectors near you.");
            proceedWithSearch({ latitude, longitude });
          }
        },
        (error) => {
          console.error('Geolocation error:', error);
          addBotMessage("I couldn't detect your location automatically. Could you tell me what city you're in?");
          setCurrentState(CONVERSATION_STATES.LOCATION_REQUEST);
        },
        { timeout: 10000, enableHighAccuracy: true }
      );
    } else {
      addBotMessage("I can't detect your location automatically. Could you tell me what city you're in?");
      setCurrentState(CONVERSATION_STATES.LOCATION_REQUEST);
    }
  };

  const proceedWithSearch = async (location) => {
    setCurrentState(CONVERSATION_STATES.SEARCHING);
    addBotMessage(`Searching for ${selectedInspectionType?.name || 'home inspectors'} in ${location.city || 'your area'}...`);
    
    try {
      // Build search parameters - ensure we're not sending 'type' for general searches
      const searchParams = new URLSearchParams();
      
      // Add location parameters if available
      if (location.latitude && location.longitude) {
        searchParams.append('lat', location.latitude);
        searchParams.append('lng', location.longitude);
      }
      if (location.city) {
        searchParams.append('city', location.city);
      }
      if (location.state) {
        searchParams.append('state', location.state);
      }
      
      // Add service type if specific inspection type selected (but not 'home' as it's the default)
      if (selectedInspectionType && selectedInspectionType.id !== 'home') {
        searchParams.append('services', selectedInspectionType.name);
      }
      
      console.log('Searching with params:', searchParams.toString());
      
      const response = await fetch(`/api/inspectors/search?${searchParams}`);
      const data = await response.json();
      
      if (data.inspectors && data.inspectors.length > 0) {
        setSearchResults(data.inspectors.slice(0, 3)); // Top 3 results
        setCurrentState(CONVERSATION_STATES.RESULTS);
        
        const plural = data.inspectors.length === 1 ? 'inspector' : 'inspectors';
        addBotMessage(`Perfect! I found ${data.inspectors.length} qualified ${plural} in your area. Here are the top 3 matches:`);
        
        // Show results in a structured format
        addBotMessage("", data.inspectors.slice(0, 3), false);
        
        setTimeout(() => {
          addBotMessage("Would you like me to help you contact any of these inspectors, or would you like to see more options?", [
            { id: 'contact', text: 'Help me contact one', action: 'contact' },
            { id: 'more', text: 'Show more results', action: 'more_results' },
            { id: 'new', text: 'Start a new search', action: 'new_search' }
          ]);
        }, 2000);
      } else {
        addBotMessage(`I couldn't find any ${selectedInspectionType?.name || 'home inspectors'} in ${location.city} right now. Would you like me to:`, [
          { id: 'expand', text: 'Search nearby areas', action: 'expand_search' },
          { id: 'notify', text: 'Notify when available', action: 'notify' },
          { id: 'different', text: 'Try a different inspection type', action: 'change_type' }
        ]);
      }
    } catch (error) {
      console.error('Search error:', error);
      addBotMessage("I'm having trouble searching right now. Let me take you to our search page instead.", [
        { id: 'search_page', text: 'Go to search page', action: 'redirect_search' }
      ]);
    }
  };

  const handleInspectionTypeSelection = (inspectionType) => {
    setSelectedInspectionType(inspectionType);
    addUserMessage(`I need a ${inspectionType.name}`);
    addBotMessage(`Great choice! ${inspectionType.description}. Now let me find inspectors in your area.`);
    
    // Auto-detect location or ask for it
    setTimeout(() => {
      detectLocation();
    }, 1000);
  };

  const handleUserInput = (e) => {
    e.preventDefault();
    if (!userInput.trim()) return;

    addUserMessage(userInput);
    const input = userInput.toLowerCase().trim();
    setUserInput('');

    if (currentState === CONVERSATION_STATES.LOCATION_REQUEST) {
      // Process manual location input - parse city and state if provided
      const locationParts = userInput.split(',').map(part => part.trim());
      const city = locationParts[0];
      const state = locationParts.length > 1 ? locationParts[1].toUpperCase().replace(/[^A-Z]/g, '') : null;
      
      const locationData = { 
        city, 
        state: state && state.length === 2 ? state : null,
        manual: true 
      };
      
      setUserLocation(locationData);
      addBotMessage(`Thank you! Searching for inspectors in ${city}${state ? `, ${state}` : ''}...`);
      proceedWithSearch(locationData);
    } else {
      // General conversation handling
      if (input.includes('help') || input.includes('support')) {
        addBotMessage("I'm here to help you find qualified home inspectors. I can help you with:", [
          { id: 'find', text: 'Find inspectors', action: 'find_inspectors' },
          { id: 'types', text: 'Inspection types', action: 'inspection_types' },
          { id: 'pricing', text: 'Pricing information', action: 'pricing' },
          { id: 'human', text: 'Talk to a human', action: 'human_support' }
        ]);
      } else {
        addBotMessage("I didn't quite understand that. Let me help you find an inspector. What type of inspection do you need?");
        setCurrentState(CONVERSATION_STATES.INSPECTION_TYPE);
      }
    }
  };

  const handleOptionClick = (option) => {
    addUserMessage(option.text);

    switch (option.action) {
      case 'contact':
        addBotMessage("Which inspector would you like to contact? I can provide their phone number or email, or help you schedule directly.");
        break;
      
      case 'more_results':
        router.push({
          pathname: '/search',
          query: { 
            type: selectedInspectionType?.id,
            ...(userLocation?.latitude && { lat: userLocation.latitude }),
            ...(userLocation?.longitude && { lng: userLocation.longitude }),
            ...(userLocation?.city && { city: userLocation.city })
          }
        });
        break;
      
      case 'new_search':
        setCurrentState(CONVERSATION_STATES.INSPECTION_TYPE);
        setSelectedInspectionType(null);
        setUserLocation(null);
        setSearchResults([]);
        addBotMessage("Let's start fresh! What type of inspection do you need?");
        break;
      
      case 'redirect_search':
        router.push('/search');
        break;
      
      case 'find_inspectors':
        setCurrentState(CONVERSATION_STATES.INSPECTION_TYPE);
        addBotMessage("Perfect! What type of inspection do you need?");
        break;
        
      default:
        addBotMessage("Let me help you with that. What type of inspection are you looking for?");
    }
  };

  const toggleChat = () => {
    setIsOpen(!isOpen);
    if (onClose && isOpen) {
      onClose();
    }
  };

  if (!isOpen) {
    return (
      <div className={`fixed bottom-6 right-6 z-50 ${className}`}>
        <button
          onClick={toggleChat}
          className="bg-primary-600 hover:bg-primary-700 text-white rounded-full p-4 shadow-lg transition-all duration-200 hover:scale-105"
          aria-label="Open chat assistant"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </button>
      </div>
    );
  }

  return (
    <div className={`fixed bottom-6 right-6 z-50 ${className}`}>
      <div className="bg-white rounded-lg shadow-2xl w-80 sm:w-96 h-96 flex flex-col border border-secondary-200">
        {/* Header */}
        <div className="bg-primary-600 text-white p-4 rounded-t-lg flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-sm">Inspector Assistant</h3>
              <p className="text-xs text-primary-100">Online now</p>
            </div>
          </div>
          <button
            onClick={toggleChat}
            className="text-white/80 hover:text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-secondary-50">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] px-3 py-2 rounded-lg text-sm ${
                  message.sender === 'user'
                    ? 'bg-primary-600 text-white'
                    : 'bg-white border border-secondary-200'
                }`}
              >
                {message.text && <p>{message.text}</p>}
                
                {/* Inspection Type Options */}
                {currentState === CONVERSATION_STATES.INSPECTION_TYPE && message.sender === 'bot' && !message.options && (
                  <div className="mt-2 space-y-1">
                    {INSPECTION_TYPES.map((type) => (
                      <button
                        key={type.id}
                        onClick={() => handleInspectionTypeSelection(type)}
                        className="block w-full text-left p-2 rounded border border-primary-200 hover:bg-primary-50 transition-colors text-xs"
                      >
                        <div className="font-medium">{type.name}</div>
                        <div className="text-secondary-600 text-xs">{type.description}</div>
                      </button>
                    ))}
                  </div>
                )}

                {/* Search Results */}
                {message.options && Array.isArray(message.options) && message.options.length > 0 && message.options[0].name && (
                  <div className="mt-2 space-y-2">
                    {message.options.map((inspector, index) => (
                      <div key={index} className="border border-secondary-200 rounded p-2 text-xs">
                        <div className="font-medium text-primary-600">{inspector.name}</div>
                        <div className="text-secondary-600">{inspector.city}, {inspector.state}</div>
                        <div className="text-secondary-500 text-xs">
                          {inspector.phone && <span>📞 {inspector.phone}</span>}
                          {inspector.rating && <span className="ml-2">⭐ {inspector.rating}/5</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Action Options */}
                {message.options && Array.isArray(message.options) && message.options.length > 0 && !message.options[0].name && (
                  <div className="mt-2 space-y-1">
                    {message.options.map((option) => (
                      <button
                        key={option.id}
                        onClick={() => handleOptionClick(option)}
                        className="block w-full text-left p-2 rounded bg-primary-50 hover:bg-primary-100 text-primary-700 transition-colors text-xs"
                      >
                        {option.text}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
          
          {/* Typing Indicator */}
          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-white border border-secondary-200 rounded-lg px-3 py-2">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-secondary-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-secondary-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                  <div className="w-2 h-2 bg-secondary-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-3 border-t border-secondary-200">
          <form onSubmit={handleUserInput} className="flex space-x-2">
            <input
              type="text"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 px-3 py-2 text-sm border border-secondary-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-500"
              disabled={isTyping}
            />
            <button
              type="submit"
              disabled={isTyping || !userInput.trim()}
              className="px-3 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
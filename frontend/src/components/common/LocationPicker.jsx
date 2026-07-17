import React, { useEffect, useRef, useState } from 'react';
import API_CONFIG from '../../config';
import { FiMapPin, FiNavigation, FiSearch, FiAlertTriangle } from 'react-icons/fi';
import Button from './Button';

// Global cache to track if Google Maps script has already been injected and loaded
let mapsScriptLoaded = false;
let mapsScriptLoading = false;
const mapsListeners = new Set();

const loadGoogleMapsScript = (apiKey, callback) => {
  if (mapsScriptLoaded) {
    callback();
    return;
  }

  mapsListeners.add(callback);

  if (mapsScriptLoading) return;

  mapsScriptLoading = true;
  const script = document.createElement('script');
  script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
  script.async = true;
  script.defer = true;
  script.onload = () => {
    mapsScriptLoaded = true;
    mapsScriptLoading = false;
    mapsListeners.forEach((cb) => cb());
    mapsListeners.clear();
  };
  script.onerror = () => {
    mapsScriptLoading = false;
    console.error('Failed to load Google Maps script.');
  };
  document.head.appendChild(script);
};

const LocationPicker = ({
  onChange,
  initialLat = 28.6139,
  initialLng = 77.2090,
  initialAddress = 'New Delhi, India'
}) => {
  const mapRef = useRef(null);
  const searchInputRef = useRef(null);
  const googleMapInstance = useRef(null);
  const googleMarkerInstance = useRef(null);

  const [address, setAddress] = useState(initialAddress);
  const [lat, setLat] = useState(Number(initialLat));
  const [lng, setLng] = useState(Number(initialLng));
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);
  const [apiError, setApiError] = useState(false);
  const [detecting, setDetecting] = useState(false);

  const apiKey = API_CONFIG.GOOGLE_MAPS_API_KEY;
  const isKeyConfigured = apiKey && apiKey !== 'your_google_maps_api_key_here';

  useEffect(() => {
    if (isKeyConfigured) {
      loadGoogleMapsScript(apiKey, () => {
        setIsScriptLoaded(true);
      });
    } else {
      setApiError(true);
    }
  }, [apiKey, isKeyConfigured]);

  // Initialize Map & Autocomplete once script is loaded
  useEffect(() => {
    if (!isScriptLoaded || !mapRef.current) return;

    try {
      const position = { lat, lng };

      // Initialize map
      const map = new window.google.maps.Map(mapRef.current, {
        center: position,
        zoom: 13,
        mapTypeControl: false,
        fullscreenControl: false,
        styles: [
          {
            featureType: 'administrative',
            elementType: 'geometry',
            stylers: [{ visibility: 'on' }]
          }
        ]
      });
      googleMapInstance.current = map;

      // Initialize marker
      const marker = new window.google.maps.Marker({
        position,
        map,
        draggable: true,
        animation: window.google.maps.Animation.DROP
      });
      googleMarkerInstance.current = marker;

      // Initialize Autocomplete
      const autocomplete = new window.google.maps.places.Autocomplete(searchInputRef.current, {
        types: ['geocode', 'establishment']
      });

      // Bind autocomplete to map view
      autocomplete.bindTo('bounds', map);

      // Handle place selection from autocomplete
      autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace();
        if (!place.geometry || !place.geometry.location) {
          return;
        }

        const newLat = place.geometry.location.lat();
        const newLng = place.geometry.location.lng();
        const newAddress = place.formatted_address || searchInputRef.current.value;

        setLat(newLat);
        setLng(newLng);
        setAddress(newAddress);

        map.setCenter({ lat: newLat, lng: newLng });
        map.setZoom(16);
        marker.setPosition({ lat: newLat, lng: newLng });

        onChange?.({ address: newAddress, lat: newLat, lng: newLng });
      });

      // Handle marker dragend event
      marker.addListener('dragend', () => {
        const newPos = marker.getPosition();
        const currentLat = newPos.lat();
        const currentLng = newPos.lng();

        setLat(currentLat);
        setLng(currentLng);

        // Reverse geocode to get human readable address
        const geocoder = new window.google.maps.Geocoder();
        geocoder.geocode({ location: { lat: currentLat, lng: currentLng } }, (results, status) => {
          if (status === 'OK' && results[0]) {
            const resolvedAddress = results[0].formatted_address;
            setAddress(resolvedAddress);
            onChange?.({ address: resolvedAddress, lat: currentLat, lng: currentLng });
          } else {
            onChange?.({ address: `Coordinates: ${currentLat.toFixed(5)}, ${currentLng.toFixed(5)}`, lat: currentLat, lng: currentLng });
          }
        });
      });

    } catch (err) {
      console.error('Error rendering Google Map:', err);
      setApiError(true);
    }
  }, [isScriptLoaded]);

  // Geolocate using browser API
  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      return alert('Geolocation is not supported by your browser.');
    }

    setDetecting(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const currentLat = position.coords.latitude;
        const currentLng = position.coords.longitude;

        setLat(currentLat);
        setLng(currentLng);

        if (isScriptLoaded && googleMapInstance.current && googleMarkerInstance.current) {
          const map = googleMapInstance.current;
          const marker = googleMarkerInstance.current;

          map.setCenter({ lat: currentLat, lng: currentLng });
          map.setZoom(16);
          marker.setPosition({ lat: currentLat, lng: currentLng });

          // Reverse geocode address using Google API
          const geocoder = new window.google.maps.Geocoder();
          geocoder.geocode({ location: { lat: currentLat, lng: currentLng } }, (results, status) => {
            if (status === 'OK' && results[0]) {
              const resolvedAddress = results[0].formatted_address;
              setAddress(resolvedAddress);
              setDetecting(false);
              onChange?.({ address: resolvedAddress, lat: currentLat, lng: currentLng });
            } else {
              const defaultAddr = `Location (${currentLat.toFixed(5)}, ${currentLng.toFixed(5)})`;
              setAddress(defaultAddr);
              setDetecting(false);
              onChange?.({ address: defaultAddr, lat: currentLat, lng: currentLng });
            }
          });
        } else {
          // Fallback geocoding simulator
          const fallbackAddress = `Detected Location: ${currentLat.toFixed(4)}, ${currentLng.toFixed(4)}`;
          setAddress(fallbackAddress);
          setDetecting(false);
          onChange?.({ address: fallbackAddress, lat: currentLat, lng: currentLng });
        }
      },
      (error) => {
        console.error('Geolocation detection failed:', error);
        alert('Could not detect location. Please check your browser permission settings.');
        setDetecting(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Manual fallback inputs change handler (when API key is missing)
  const handleManualChange = (newAddress, newLat, newLng) => {
    const updatedAddress = newAddress !== undefined ? newAddress : address;
    const updatedLat = newLat !== undefined ? parseFloat(newLat) || 0 : lat;
    const updatedLng = newLng !== undefined ? parseFloat(newLng) || 0 : lng;

    setAddress(updatedAddress);
    setLat(updatedLat);
    setLng(updatedLng);
    onChange?.({ address: updatedAddress, lat: updatedLat, lng: updatedLng });
  };

  return (
    <div className="flex flex-col gap-4 w-full bg-surface-tertiary/30 p-4 rounded-premium border border-border">
      {/* Top action header: Address Autocomplete & Detect Button */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 relative">
          <FiSearch className="absolute left-3.5 top-3.5 text-text-tertiary" />
          <input
            ref={searchInputRef}
            type="text"
            placeholder={
              apiError
                ? 'Enter your business address manually...'
                : 'Search address or select location...'
            }
            value={address}
            onChange={(e) => handleManualChange(e.target.value, undefined, undefined)}
            className="w-full pl-10 pr-4 py-2.5 text-sm border border-border rounded-premium bg-surface/80 text-brand-navy focus:outline-none focus:ring-2 focus:ring-brand-purple/20 focus:border-brand-purple placeholder-text-tertiary"
          />
        </div>
        <Button
          type="button"
          variant="glass"
          onClick={handleDetectLocation}
          isLoading={detecting}
          icon={FiNavigation}
          className="whitespace-nowrap"
        >
          {detecting ? 'Detecting...' : 'Detect Location'}
        </Button>
      </div>

      {/* Map display / Fallback container */}
      {apiError ? (
        <div className="flex flex-col gap-4">
          <div className="p-4 bg-brand-orange/5 border border-brand-orange/20 rounded-premium flex items-start gap-3 text-xs text-brand-orange">
            <FiAlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Google Maps API Key Missing</p>
              <p className="text-text-secondary mt-1">
                For complete interactive maps search, add your key to <code>VITE_GOOGLE_MAPS_API_KEY</code> in the frontend <code>.env</code> file.
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">Latitude</label>
              <input
                type="number"
                step="any"
                value={lat}
                onChange={(e) => handleManualChange(undefined, e.target.value, undefined)}
                className="w-full px-4 py-2.5 text-sm border border-border rounded-premium bg-surface/50 text-brand-navy focus:outline-none focus:ring-2 focus:ring-brand-purple/20"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-text-secondary uppercase tracking-wider">Longitude</label>
              <input
                type="number"
                step="any"
                value={lng}
                onChange={(e) => handleManualChange(undefined, undefined, e.target.value)}
                className="w-full px-4 py-2.5 text-sm border border-border rounded-premium bg-surface/50 text-brand-navy focus:outline-none focus:ring-2 focus:ring-brand-purple/20"
              />
            </div>
          </div>
        </div>
      ) : (
        <div className="relative overflow-hidden rounded-premium border border-border h-[260px] bg-surface-secondary flex items-center justify-center">
          {!isScriptLoaded && (
            <div className="flex flex-col items-center gap-2 text-text-secondary">
              <div className="w-6 h-6 border-2 border-brand-purple border-t-transparent rounded-full animate-spin" />
              <span className="text-xs font-semibold">Loading Map...</span>
            </div>
          )}
          <div ref={mapRef} className="w-full h-full" style={{ display: isScriptLoaded ? 'block' : 'none' }} />
        </div>
      )}

      {/* Selected location pill indicator */}
      {lat !== 0 && lng !== 0 && (
        <div className="flex items-center gap-2 text-xs text-text-secondary">
          <FiMapPin className="text-brand-purple flex-shrink-0" />
          <span>Coordinates: {lat.toFixed(5)}, {lng.toFixed(5)}</span>
        </div>
      )}
    </div>
  );
};

export default LocationPicker;

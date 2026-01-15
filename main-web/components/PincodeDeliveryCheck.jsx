"use client";
import { useState } from 'react';
import { Check, X, Loader2, AlertCircle } from 'lucide-react';

export default function PincodeDeliveryCheck({ onDeliveryCheck }) {
  const [pincode, setPincode] = useState('');
  const [status, setStatus] = useState(null); // null, 'checking', 'available', 'unavailable'
  const [deliveryInfo, setDeliveryInfo] = useState(null);
  const [error, setError] = useState('');

  const checkDelivery = async (pincodeValue) => {
    if (!pincodeValue || pincodeValue.length !== 6) {
      setStatus(null);
      setDeliveryInfo(null);
      setError('');
      return;
    }

    setStatus('checking');
    setError('');
    
    try {
      const response = await fetch(`/api/shiprocket/serviceability?pincode=${pincodeValue}&pickup_pincode=400001&weight=0.5`);
      const data = await response.json();
      
      if (response.ok) {
        if (data.deliverable) {
          setStatus('available');
          setDeliveryInfo({
            estimatedDays: data.estimatedDays,
            codAvailable: data.codAvailable,
            courierPartners: data.courierPartners?.length || 0
          });
          onDeliveryCheck?.(true, data);
        } else {
          setStatus('unavailable');
          setDeliveryInfo(null);
          setError(data.message || "Delivery not available to this pincode");
          onDeliveryCheck?.(false, data);
        }
      } else {
        setStatus('unavailable');
        setError(data.error || "Unable to check delivery availability");
        onDeliveryCheck?.(false, data);
      }
    } catch (error) {
      setStatus('unavailable');
      setError("Network error. Please try again.");
      onDeliveryCheck?.(false, { error: error.message });
      console.error('Pincode check error:', error);
    }
  };

  const handlePincodeChange = (e) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
    setPincode(value);
    
    // Debounce the API call
    setTimeout(() => {
      if (value.length === 6) {
        checkDelivery(value);
      } else {
        setStatus(null);
        setDeliveryInfo(null);
        setError('');
      }
    }, 500);
  };

  return (
    <div className="w-full max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Check Delivery Availability</h2>
      
      <div className="relative">
        <input
          type="text"
          value={pincode}
          onChange={handlePincodeChange}
          placeholder="Enter 6-digit pincode"
          className={`w-full px-4 py-3 pr-10 border rounded-lg text-sm focus:ring-2 focus:border-transparent ${
            status === 'available' ? 'border-green-500 focus:ring-green-500' :
            status === 'unavailable' ? 'border-red-500 focus:ring-red-500' :
            'border-gray-300 focus:ring-blue-500'
          }`}
          maxLength={6}
        />
        
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
          {status === 'checking' && (
            <Loader2 className="w-4 h-4 text-gray-500 animate-spin" />
          )}
          {status === 'available' && (
            <Check className="w-4 h-4 text-green-500" />
          )}
          {status === 'unavailable' && (
            <X className="w-4 h-4 text-red-500" />
          )}
        </div>
      </div>

      {/* Success Message */}
      {status === 'available' && deliveryInfo && (
        <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center gap-2 text-green-700 mb-2">
            <Check className="w-4 h-4" />
            <span className="font-medium">Delivery Available!</span>
          </div>
          <div className="text-sm text-green-600 space-y-1">
            {deliveryInfo.estimatedDays && (
              <p>• Estimated delivery: {deliveryInfo.estimatedDays} days</p>
            )}
            {/* <p>• {deliveryInfo.courierPartners} courier partner(s) available</p> */}
            {deliveryInfo.codAvailable && (
              <p>• Cash on Delivery available</p>
            )}
          </div>
        </div>
      )}

      {/* Error Message */}
      {status === 'unavailable' && error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-2 text-red-700 mb-2">
            <AlertCircle className="w-4 h-4" />
            <span className="font-medium">Delivery Not Available</span>
          </div>
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}
    </div>
  );
}
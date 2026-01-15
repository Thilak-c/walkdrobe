import { NextResponse } from 'next/server';
import { shiprocketFetch } from '@/lib/shiprocketClient';

export async function POST(request) {
  try {
    // expects { pickup_postcode, delivery_postcode, cod, weight } in body
    const body = await request.json();
    const query = new URLSearchParams(body).toString();
    const data = await shiprocketFetch(`/courier/serviceability/?${query}`, { method: 'GET' });
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// New GET endpoint for simple pincode delivery check
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const deliveryPincode = searchParams.get('pincode');
    // Get pickup pincode from env variable or use default
    const defaultPickupPincode = process.env.SHIPROCKET_PICKUP_PINCODE || '400001';
    const pickupPincode = searchParams.get('pickup_pincode') || defaultPickupPincode;
    const cod = searchParams.get('cod') || '1'; // Default COD enabled
    const weight = searchParams.get('weight') || '0.5'; // Default weight 0.5kg


    if (!deliveryPincode) {
      return NextResponse.json({ error: 'Pincode is required' }, { status: 400 });
    }

    // Check if pincode is valid (6 digits)
    if (!/^\d{6}$/.test(deliveryPincode)) {
      return NextResponse.json({ 
        error: 'Invalid pincode format. Please enter a 6-digit pincode.',
        deliverable: false 
      }, { status: 400 });
    }

    const query = new URLSearchParams({
      pickup_postcode: pickupPincode,
      delivery_postcode: deliveryPincode,
      cod,
      weight
    }).toString();


    const data = await shiprocketFetch(`/courier/serviceability/?${query}`, { method: 'GET' });
    
    
    // Process the response to provide a cleaner format
    const availableCouriers = data.data?.available_courier_companies || [];
    const response = {
      deliverable: availableCouriers.length > 0,
      pincode: deliveryPincode,
      courierPartners: availableCouriers,
      estimatedDays: availableCouriers[0]?.etd || null,
      codAvailable: availableCouriers.some(courier => courier.cod === 1 || courier.cod === true) || false,
      message: availableCouriers.length > 0
        ? 'Delivery available to this pincode' 
        : 'Delivery not available to this pincode'
    };


    return NextResponse.json(response);
  } catch (err) {
    
    // Handle rate limiting / account blocked errors gracefully
    if (err.message.includes('blocked') || err.message.includes('too many') || err.message.includes('Invalid email')) {
      return NextResponse.json({ 
        error: 'Delivery check temporarily unavailable. Please proceed with your order.',
        deliverable: true, // Allow checkout to continue
        pincode: request.url.split('pincode=')[1]?.split('&')[0],
        message: 'Delivery check temporarily unavailable. We will verify delivery availability after order placement.',
        temporaryError: true
      }, { status: 200 }); // Return 200 to not block checkout
    }
    
    return NextResponse.json({ 
      error: err.message,
      deliverable: false,
      message: 'Unable to check delivery availability. Please try again.'
    }, { status: 500 });
  }
}
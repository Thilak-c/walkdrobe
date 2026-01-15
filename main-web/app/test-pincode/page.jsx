"use client";
import PincodeDeliveryCheck from '@/components/PincodeDeliveryCheck';

export default function TestPincodePage() {
  const handleDeliveryCheck = (isDeliverable, data) => {
    console.log('Delivery check result:', { isDeliverable, data });
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-2xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Pincode Delivery Check Test
          </h1>
          <p className="text-gray-600">
            Test the Shiprocket pincode delivery availability feature
          </p>
        </div>

        <PincodeDeliveryCheck onDeliveryCheck={handleDeliveryCheck} />

        <div className="mt-8 p-6 bg-white rounded-lg shadow-lg">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Test Pincodes:</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-medium text-gray-700 mb-2">Available Pincodes:</h4>
              <ul className="space-y-1 text-gray-600">
                <li>• 400001 (Mumbai)</li>
                <li>• 110001 (Delhi)</li>
                <li>• 560001 (Bangalore)</li>
                <li>• 600001 (Chennai)</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-gray-700 mb-2">Test Features:</h4>
              <ul className="space-y-1 text-gray-600">
                <li>• Real-time delivery check</li>
                <li>• Estimated delivery days</li>
                <li>• COD availability</li>
                <li>• Courier partner count</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-6 text-center">
          <a 
            href="/checkout" 
            className="inline-flex items-center px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            Go to Checkout
          </a>
        </div>
      </div>
    </div>
  );
}
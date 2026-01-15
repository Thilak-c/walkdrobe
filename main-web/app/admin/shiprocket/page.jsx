"use client";
import { useState, useEffect } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Package, Truck, AlertCircle, CheckCircle, RefreshCw, ExternalLink } from "lucide-react";

export default function ShiprocketAdminPage() {
  const [retryingOrders, setRetryingOrders] = useState(new Set());
  
  // Get orders with Shiprocket details
  const orders = useQuery(api.orders.getOrdersWithShiprocket, { limit: 100 });

  const handleRetryShiprocket = async (orderNumber) => {
    setRetryingOrders(prev => new Set([...prev, orderNumber]));
    
    try {
      const response = await fetch('/api/auto-shiprocket', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ orderNumber }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        alert(`Shiprocket order created successfully for ${orderNumber}`);
      } else {
        alert(`Failed to create Shiprocket order: ${result.error}`);
      }
    } catch (error) {
      alert(`Error: ${error.message}`);
    } finally {
      setRetryingOrders(prev => {
        const newSet = new Set(prev);
        newSet.delete(orderNumber);
        return newSet;
      });
    }
  };

  const getStatusIcon = (order) => {
    if (order.hasShiprocketOrder) {
      return <CheckCircle className="w-5 h-5 text-green-600" />;
    } else if (order.shiprocketDetails?.status === 'failed') {
      return <AlertCircle className="w-5 h-5 text-red-600" />;
    } else {
      return <Package className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusText = (order) => {
    if (order.hasShiprocketOrder) {
      return `Created (${order.courierName || 'Unknown Courier'})`;
    } else if (order.shiprocketDetails?.status === 'failed') {
      return `Failed: ${order.shiprocketDetails.error || 'Unknown error'}`;
    } else if (order.paymentDetails.paymentMethod === 'cod' && order.paymentDetails.status === 'pending') {
      return 'Pending COD Payment';
    } else {
      return 'Not Created';
    }
  };

  if (!orders) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Shiprocket Orders Management</h1>
          <p className="mt-2 text-gray-600">
            Manage and monitor Shiprocket order creation and tracking
          </p>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <Package className="w-8 h-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Orders</p>
                <p className="text-2xl font-bold text-gray-900">{orders.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <CheckCircle className="w-8 h-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Shiprocket Created</p>
                <p className="text-2xl font-bold text-gray-900">
                  {orders.filter(order => order.hasShiprocketOrder).length}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <AlertCircle className="w-8 h-8 text-red-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Failed</p>
                <p className="text-2xl font-bold text-gray-900">
                  {orders.filter(order => order.shiprocketDetails?.status === 'failed').length}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <Truck className="w-8 h-8 text-yellow-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-gray-900">
                  {orders.filter(order => !order.hasShiprocketOrder && order.shiprocketDetails?.status !== 'failed').length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Orders Table */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Recent Orders</h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Order
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Payment
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Shiprocket Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    AWB Code
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {orders.map((order) => (
                  <tr key={order._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {order.orderNumber}
                        </div>
                        <div className="text-sm text-gray-500">
                          {new Date(order.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {order.shippingDetails.fullName}
                        </div>
                        <div className="text-sm text-gray-500">
                          {order.shippingDetails.city}, {order.shippingDetails.pincode}
                        </div>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          ₹{order.orderTotal}
                        </div>
                        <div className="text-sm text-gray-500 capitalize">
                          {order.paymentDetails.paymentMethod} - {order.paymentDetails.status}
                        </div>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {getStatusIcon(order)}
                        <span className="ml-2 text-sm text-gray-900">
                          {getStatusText(order)}
                        </span>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {order.awbCode ? (
                        <div className="flex items-center">
                          <span>{order.awbCode}</span>
                          <a
                            href={`https://shiprocket.co/tracking/${order.awbCode}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="ml-2 text-blue-600 hover:text-blue-800"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {!order.hasShiprocketOrder && (
                        <button
                          onClick={() => handleRetryShiprocket(order.orderNumber)}
                          disabled={retryingOrders.has(order.orderNumber)}
                          className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                        >
                          {retryingOrders.has(order.orderNumber) ? (
                            <>
                              <RefreshCw className="w-4 h-4 mr-1 animate-spin" />
                              Creating...
                            </>
                          ) : (
                            <>
                              <Package className="w-4 h-4 mr-1" />
                              Create Order
                            </>
                          )}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
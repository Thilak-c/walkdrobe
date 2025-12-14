"use client";

import { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import { Bell, AlertTriangle, Save, CheckCircle } from "lucide-react";
import toast from "react-hot-toast";

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    lowStockThreshold: 10,
    criticalStockThreshold: 5,
    emailAlerts: false,
    alertEmail: "",
  });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("inventorySettings");
    if (stored) {
      setSettings(JSON.parse(stored));
    }
  }, []);

  const handleSave = () => {
    localStorage.setItem("inventorySettings", JSON.stringify(settings));
    toast.success("Settings saved!");
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      
      <main className="flex-1 p-4 lg:p-8">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="mb-8 pt-12 lg:pt-0">
            <p className="text-gray-400 tracking-widest text-xs font-medium mb-2">PREFERENCES</p>
            <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 font-poppins">Settings</h1>
            <p className="text-gray-500 text-sm mt-1">Configure your inventory preferences</p>
          </div>

          {/* Stock Thresholds */}
          <div className="bg-white rounded-2xl p-6 border border-gray-100 mb-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-amber-100 rounded-xl">
                <AlertTriangle className="text-amber-500" size={22} />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900 font-poppins">Stock Thresholds</h2>
                <p className="text-sm text-gray-400">Set when to trigger alerts</p>
              </div>
            </div>
            
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Low Stock Threshold
                </label>
                <input
                  type="number"
                  value={settings.lowStockThreshold}
                  onChange={(e) => setSettings({ ...settings, lowStockThreshold: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-3 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-gray-900 text-sm"
                  min="1"
                />
                <p className="text-xs text-gray-400 mt-2">Products below this will show as "Low Stock"</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Critical Stock Threshold
                </label>
                <input
                  type="number"
                  value={settings.criticalStockThreshold}
                  onChange={(e) => setSettings({ ...settings, criticalStockThreshold: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-3 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-gray-900 text-sm"
                  min="1"
                />
                <p className="text-xs text-gray-400 mt-2">Products below this will trigger urgent alerts</p>
              </div>
            </div>
          </div>

          {/* Notifications */}
          <div className="bg-white rounded-2xl p-6 border border-gray-100 mb-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-blue-100 rounded-xl">
                <Bell className="text-blue-500" size={22} />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900 font-poppins">Notifications</h2>
                <p className="text-sm text-gray-400">Manage alert preferences</p>
              </div>
            </div>
            
            <div className="space-y-5">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <div>
                  <p className="font-medium text-gray-900">Email Alerts</p>
                  <p className="text-sm text-gray-400">Get notified when stock is low</p>
                </div>
                <button
                  onClick={() => setSettings({ ...settings, emailAlerts: !settings.emailAlerts })}
                  className={`relative w-14 h-7 rounded-full transition-colors ${
                    settings.emailAlerts ? "bg-gray-900" : "bg-gray-200"
                  }`}
                >
                  <span className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                    settings.emailAlerts ? "left-8" : "left-1"
                  }`} />
                </button>
              </div>

              {settings.emailAlerts && (
                <div className="animate-fadeIn">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Alert Email
                  </label>
                  <input
                    type="email"
                    value={settings.alertEmail}
                    onChange={(e) => setSettings({ ...settings, alertEmail: e.target.value })}
                    placeholder="admin@walkdrobe.in"
                    className="w-full px-4 py-3 bg-gray-50 border-0 rounded-xl focus:ring-2 focus:ring-gray-900 text-sm"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Save Button */}
          <button
            onClick={handleSave}
            className={`w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl font-medium transition-all ${
              saved 
                ? "bg-emerald-500 text-white" 
                : "bg-gray-900 text-white hover:bg-gray-800"
            }`}
          >
            {saved ? (
              <>
                <CheckCircle size={20} />
                Saved!
              </>
            ) : (
              <>
                <Save size={20} />
                Save Settings
              </>
            )}
          </button>
        </div>
      </main>
    </div>
  );
}

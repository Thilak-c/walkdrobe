"use client";

import { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import { Globe, Bell, AlertTriangle, Save, CheckCircle, Sliders } from "lucide-react";
import toast from "react-hot-toast";

export default function WebsiteSettings() {
  const [settings, setSettings] = useState({
    lowStockThreshold: 10,
    criticalThreshold: 5,
    autoHideOutOfStock: false,
    emailAlerts: false,
    alertEmail: "",
  });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("web_settings");
    if (stored) setSettings({ ...settings, ...JSON.parse(stored) });
  }, []);

  const handleSave = () => {
    localStorage.setItem("web_settings", JSON.stringify(settings));
    toast.success("Settings saved!");
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <main className="flex-1 p-4 lg:p-8">
        <div className="max-w-xl mx-auto">
          {/* Header */}
          <div className="mb-6 pt-12 lg:pt-0">
            <div className="flex items-center gap-2 mb-1">
              <Globe size={16} className="text-gray-400" />
              <p className="text-gray-400 text-xs font-medium">WEBSITE STORE</p>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          </div>

          {/* Stock Thresholds */}
          <div className="bg-white rounded-xl p-5 border border-gray-200 mb-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-gray-100 rounded-lg">
                <AlertTriangle size={18} className="text-gray-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Stock Thresholds</h3>
                <p className="text-sm text-gray-500">When to trigger alerts</p>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-600 mb-1 block">Low Stock Threshold</label>
                <input type="number" value={settings.lowStockThreshold} onChange={e => setSettings({ ...settings, lowStockThreshold: +e.target.value })} min="1" className="w-full px-3 py-2.5 bg-gray-50 rounded-lg text-sm border-0 focus:ring-2 focus:ring-gray-900" />
                <p className="text-xs text-gray-400 mt-1">Products below this show as "Low Stock"</p>
              </div>
              <div>
                <label className="text-sm text-gray-600 mb-1 block">Critical Threshold</label>
                <input type="number" value={settings.criticalThreshold} onChange={e => setSettings({ ...settings, criticalThreshold: +e.target.value })} min="1" className="w-full px-3 py-2.5 bg-gray-50 rounded-lg text-sm border-0 focus:ring-2 focus:ring-gray-900" />
                <p className="text-xs text-gray-400 mt-1">Products below this trigger urgent alerts</p>
              </div>
            </div>
          </div>

          {/* Behavior */}
          <div className="bg-white rounded-xl p-5 border border-gray-200 mb-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-gray-100 rounded-lg">
                <Sliders size={18} className="text-gray-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Behavior</h3>
                <p className="text-sm text-gray-500">Inventory settings</p>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="text-sm font-medium text-gray-900">Auto-hide Out of Stock</p>
                <p className="text-xs text-gray-500">Hide products when stock is 0</p>
              </div>
              <button onClick={() => setSettings({ ...settings, autoHideOutOfStock: !settings.autoHideOutOfStock })} className={`w-12 h-6 rounded-full transition ${settings.autoHideOutOfStock ? "bg-gray-900" : "bg-gray-300"}`}>
                <span className={`block w-5 h-5 bg-white rounded-full shadow transition-transform ${settings.autoHideOutOfStock ? "translate-x-6" : "translate-x-0.5"}`} />
              </button>
            </div>
          </div>

          {/* Notifications */}
          <div className="bg-white rounded-xl p-5 border border-gray-200 mb-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-gray-100 rounded-lg">
                <Bell size={18} className="text-gray-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Notifications</h3>
                <p className="text-sm text-gray-500">Alert preferences</p>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-900">Email Alerts</p>
                  <p className="text-xs text-gray-500">Get notified for low stock</p>
                </div>
                <button onClick={() => setSettings({ ...settings, emailAlerts: !settings.emailAlerts })} className={`w-12 h-6 rounded-full transition ${settings.emailAlerts ? "bg-gray-900" : "bg-gray-300"}`}>
                  <span className={`block w-5 h-5 bg-white rounded-full shadow transition-transform ${settings.emailAlerts ? "translate-x-6" : "translate-x-0.5"}`} />
                </button>
              </div>
              {settings.emailAlerts && (
                <div>
                  <label className="text-sm text-gray-600 mb-1 block">Alert Email</label>
                  <input type="email" value={settings.alertEmail} onChange={e => setSettings({ ...settings, alertEmail: e.target.value })} placeholder="admin@example.com" className="w-full px-3 py-2.5 bg-gray-50 rounded-lg text-sm border-0 focus:ring-2 focus:ring-gray-900" />
                </div>
              )}
            </div>
          </div>

          {/* Save */}
          <button onClick={handleSave} className={`w-full py-3 rounded-xl font-medium flex items-center justify-center gap-2 transition ${saved ? "bg-gray-700 text-white" : "bg-gray-900 text-white hover:bg-gray-800"}`}>
            {saved ? <><CheckCircle size={18} /> Saved!</> : <><Save size={18} /> Save Settings</>}
          </button>
        </div>
      </main>
    </div>
  );
}

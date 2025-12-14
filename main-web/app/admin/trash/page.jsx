"use client";
import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import {
  FiTrash2,
  FiRotateCcw,
  FiTrash,
  FiUser,
  FiPackage,
  FiFilter,
  FiSearch,
  FiCalendar,
  FiRefreshCw,
  FiEye,
  FiMail,
  FiShield,
  FiUserCheck,
  FiAlertTriangle
} from "react-icons/fi";

const getSessionToken = () => {
  if (typeof document === "undefined") return null;
  const m = document.cookie.match(/(?:^|; )sessionToken=([^;]+)/);
  return m ? decodeURIComponent(m[1]) : null;
};

export default function AdminTrash() {
  const token = getSessionToken();
  const adminUser = useQuery(api.users.adminMeByToken, token ? { token } : "skip");
  const allTrashItems = useQuery(api.users.getTrashItems);
  
  const restoreFromTrash = useMutation(api.users.restoreFromTrash);
  const permanentDelete = useMutation(api.users.permanentDelete);
  const emptyTrash = useMutation(api.users.emptyTrash);

  const [tableFilter, setTableFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedItem, setSelectedItem] = useState(null);
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showEmptyModal, setShowEmptyModal] = useState(false);
  const [showDetails, setShowDetails] = useState(null);

  const isSuperAdmin = adminUser?.role === "super_admin";

  // Filter trash items
  const filteredItems = allTrashItems?.filter(item => {
    const matchesTable = tableFilter === "all" || item.tableName === tableFilter;
    
    let matchesSearch = true;
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      if (item.tableName === "users") {
        matchesSearch = 
          item.originalData.email?.toLowerCase().includes(searchLower) ||
          item.originalData.name?.toLowerCase().includes(searchLower);
      } else if (item.tableName === "products") {
        matchesSearch = 
          item.originalData.name?.toLowerCase().includes(searchLower) ||
          item.originalData.description?.toLowerCase().includes(searchLower);
      }
    }
    
    return matchesTable && matchesSearch;
  }) || [];

  const handleRestore = (item) => {
    setSelectedItem(item);
    setShowRestoreModal(true);
  };

  const handlePermanentDelete = (item) => {
    setSelectedItem(item);
    setShowDeleteModal(true);
  };

  const confirmRestore = async () => {
    if (!selectedItem || !adminUser) return;
    
    try {
      await restoreFromTrash({ 
        trashId: selectedItem._id, 
        restoredBy: adminUser._id 
      });
      toast.success("Item restored successfully!");
      setShowRestoreModal(false);
      setSelectedItem(null);
    } catch (error) {
      toast.error(error.message);
    }
  };

  const confirmPermanentDelete = async () => {
    if (!selectedItem || !adminUser) return;
    
    try {
      await permanentDelete({ 
        trashId: selectedItem._id, 
        deletedBy: adminUser._id 
      });
      toast.success("Item permanently deleted!");
      setShowDeleteModal(false);
      setSelectedItem(null);
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleEmptyTrash = async () => {
    if (!adminUser) return;
    
    try {
      await emptyTrash({ 
        deletedBy: adminUser._id,
        tableName: tableFilter === "all" ? undefined : tableFilter
      });
      toast.success("Trash emptied successfully!");
      setShowEmptyModal(false);
    } catch (error) {
      toast.error(error.message);
    }
  };

  const getTableIcon = (tableName) => {
    switch (tableName) {
      case "users": return <FiUser className="text-blue-600" />;
      case "products": return <FiPackage className="text-green-600" />;
      default: return <FiTrash2 className="text-gray-600" />;
    }
  };

  const getTableColor = (tableName) => {
    switch (tableName) {
      case "users": return "bg-blue-100 text-blue-800 border-blue-200";
      case "products": return "bg-green-100 text-green-800 border-green-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };



  if (!isSuperAdmin) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center space-y-4">
          <FiShield size={48} className="text-red-500 mx-auto" />
          <h2 className="text-xl font-bold text-gray-900">Access Denied</h2>
          <p className="text-gray-600">Only super admins can access the trash.</p>
        </div>
      </div>
    );
  }

  if (allTrashItems === undefined) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FiTrash2 className="text-2xl text-red-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Trash Management</h1>
            <p className="text-gray-600">Restore or permanently delete items</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-sm text-gray-600">Items in Trash</p>
            <p className="text-2xl font-bold text-red-600">{allTrashItems?.length || 0}</p>
          </div>
          {filteredItems.length > 0 && (
            <button
              onClick={() => setShowEmptyModal(true)}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 flex items-center gap-2"
            >
              <FiTrash size={16} />
              Empty Trash
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6 space-y-4">
        <div className="grid md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search deleted items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
            />
          </div>

          {/* Table Filter */}
          <div className="relative">
            <FiFilter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <select
              value={tableFilter}
              onChange={(e) => setTableFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
            >
              <option value="all">All Items</option>
              <option value="users">Users</option>
              <option value="products">Products</option>
            </select>
          </div>

          {/* Stats */}
          <div className="text-sm text-gray-600">
            Showing {filteredItems.length} of {allTrashItems?.length || 0} items
          </div>
        </div>
      </div>

      {/* Trash Items */}
      {filteredItems.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <FiTrash2 className="text-4xl text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Trash is Empty</h3>
          <p className="text-gray-600">No deleted items found.</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Item
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Deleted
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredItems.map((item) => {
                  return (
                    <motion.tr
                      key={item._id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="hover:bg-gray-50"
                    >
                      {/* Item Info */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center bg-gray-100 rounded-full">
                            {getTableIcon(item.tableName)}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {item.tableName === "users" ? 
                                item.originalData.name || "No name" : 
                                item.originalData.name || "Untitled"
                              }
                            </div>
                            <div className="text-sm text-gray-500">
                              {item.tableName === "users" ? (
                                <div className="flex items-center gap-1">
                                  <FiMail size={12} />
                                  {item.originalData.email}
                                </div>
                              ) : (
                                item.originalData.description?.substring(0, 50) + "..."
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Type */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${getTableColor(item.tableName)}`}>
                          {getTableIcon(item.tableName)}
                          {item.tableName}
                        </span>
                      </td>

                      {/* Deleted Info */}
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1">
                            <FiCalendar size={12} />
                            {new Date(item.deletedAt).toLocaleDateString()}
                          </div>
                          <div className="text-xs text-gray-400">
                            {item.deletionReason}
                          </div>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-2">
                          {/* View Details */}
                          <button
                            onClick={() => setShowDetails(item)}
                            className="text-blue-600 hover:text-blue-900"
                            title="View Details"
                          >
                            <FiEye size={16} />
                          </button>

                          {/* Restore */}
                          {item.canRestore && (
                            <button
                              onClick={() => handleRestore(item)}
                              className="text-green-600 hover:text-green-900"
                              title="Restore"
                            >
                              <FiRotateCcw size={16} />
                            </button>
                          )}

                          {/* Permanent Delete */}
                          <button
                            onClick={() => handlePermanentDelete(item)}
                            className="text-red-600 hover:text-red-900"
                            title="Permanent Delete"
                          >
                            <FiTrash size={16} />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Restore Modal */}
      {showRestoreModal && selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Restore Item</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to restore this {selectedItem.tableName.slice(0, -1)}? 
              It will be moved back to the active list.
            </p>

            <div className="flex gap-3">
              <button
                onClick={confirmRestore}
                className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center justify-center gap-2"
              >
                <FiRotateCcw size={16} />
                Restore
              </button>
              <button
                onClick={() => setShowRestoreModal(false)}
                className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Permanent Delete Modal */}
      {showDeleteModal && selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Permanent Delete</h3>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <div className="flex items-center gap-2 text-red-800">
                <FiAlertTriangle size={16} />
                <strong>Warning: This action cannot be undone!</strong>
              </div>
              <p className="text-red-700 text-sm mt-1">
                The item will be permanently deleted from the database.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={confirmPermanentDelete}
                className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 flex items-center justify-center gap-2"
              >
                <FiTrash size={16} />
                Delete Forever
              </button>
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Empty Trash Modal */}
      {showEmptyModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Empty Trash</h3>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <div className="flex items-center gap-2 text-red-800">
                <FiAlertTriangle size={16} />
                <strong>Warning: This will permanently delete ALL items!</strong>
              </div>
              <p className="text-red-700 text-sm mt-1">
                {tableFilter === "all" ? 
                  "All items in trash will be permanently deleted." :
                  `All ${tableFilter} in trash will be permanently deleted.`
                }
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleEmptyTrash}
                className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 flex items-center justify-center gap-2"
              >
                <FiTrash size={16} />
                Empty Trash
              </button>
              <button
                onClick={() => setShowEmptyModal(false)}
                className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {showDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-96 overflow-y-auto">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Item Details</h3>
            <div className="space-y-4">
              <div>
                <strong>Type:</strong> {showDetails.tableName}
              </div>
              <div>
                <strong>Deleted:</strong> {new Date(showDetails.deletedAt).toLocaleString()}
              </div>
              <div>
                <strong>Reason:</strong> {showDetails.deletionReason}
              </div>
              <div>
                <strong>Original Data:</strong>
                <pre className="mt-2 p-3 bg-gray-100 rounded text-sm overflow-x-auto">
                  {JSON.stringify(showDetails.originalData, null, 2)}
                </pre>
              </div>
            </div>
            <div className="flex justify-end mt-6">
              <button
                onClick={() => setShowDetails(null)}
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 
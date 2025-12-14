"use client";
import { useState, useEffect } from "react";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import {
  FiUsers,
  FiEdit3,
  FiTrash2,
  FiEye,
  FiToggleLeft,
  FiToggleRight,
  FiSearch,
  FiFilter,
  FiShield,
  FiUser,
  FiUserCheck,
  FiMail,
  FiPhone,
  FiMapPin,
  FiCalendar,
  FiLock,
  FiKey,
  FiAlertTriangle,
  FiCopy,
} from "react-icons/fi";

const getSessionToken = () => {
  if (typeof document === "undefined") return null;
  const m = document.cookie.match(/(?:^|; )sessionToken=([^;]+)/);
  return m ? decodeURIComponent(m[1]) : null;
};

export default function AdminUsers() {
  const token = getSessionToken();
  const adminUser = useQuery(api.users.adminMeByToken, token ? { token } : "skip");
  const allUsers = useQuery(api.users.getAllUsers);
  
  const deleteUser = useMutation(api.users.deleteUser);
  const updateUser = useMutation(api.users.updateUser);
  const toggleUserStatus = useMutation(api.users.toggleUserStatus);
  const reactivateAdminAccount = useMutation(api.users.reactivateAdminAccount);
  const setUserPassword = useAction(api.auth.setUserPasswordWithView);
  const clearTempPassword = useMutation(api.users.clearTempPassword);

  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedUser, setSelectedUser] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showSetPasswordModal, setShowSetPasswordModal] = useState(false);
  const [editForm, setEditForm] = useState({ name: "", role: "", isActive: true });
  const [newPassword, setNewPassword] = useState("");

  // Only query password when modal is open and we have a selected user
  const viewUserPassword = useQuery(
    api.users.viewUserPassword, 
    selectedUser && showPasswordModal && adminUser ? 
    { userId: selectedUser._id, requestedBy: adminUser._id } : 
    "skip"
  );
  
  const viewTempPassword = useQuery(
    api.users.viewTempPassword,
    selectedUser && showPasswordModal && adminUser ? 
    { userId: selectedUser._id, requestedBy: adminUser._id } : 
    "skip"
  );

  const isSuperAdmin = adminUser?.role === "super_admin";

  // Filter users based on search and filters
  const filteredUsers = allUsers?.filter(user => {
    const matchesSearch = user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (user.name || "").toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === "all" || user.role === roleFilter;
    const matchesStatus = statusFilter === "all" || 
                         (statusFilter === "active" && user.isActive) ||
                         (statusFilter === "inactive" && !user.isActive);
    
    return matchesSearch && matchesRole && matchesStatus;
  }) || [];

  const handleEdit = (user) => {
    setSelectedUser(user);
    setEditForm({
      name: user.name || "",
      role: user.role,
      isActive: user.isActive,
    });
    setShowEditModal(true);
  };

  const handleDelete = (user) => {
    setSelectedUser(user);
    setShowDeleteModal(true);
  };

  const handleViewPassword = (user) => {
    setSelectedUser(user);
    setShowPasswordModal(true);
  };

  const handleSetPassword = (user) => {
    setSelectedUser(user);
    setNewPassword("");
    setShowSetPasswordModal(true);
  };

  const handleReactivate = async (user) => {
    if (!adminUser) return;
    
    try {
      if (user.role === "admin" || user.role === "super_admin") {
        // Use reactivateAdminAccount for admin users
        await reactivateAdminAccount({
          userId: user._id,
          reactivatedBy: adminUser._id,
        });
      } else {
        // For regular users, we can use the updateUser function to set isActive to true
        await updateUser({
          userId: user._id,
          isActive: true,
          updatedBy: adminUser._id,
        });
      }
      toast.success("User account reactivated successfully!");
    } catch (error) {
      toast.error(error.message);
    }
  };

  const confirmEdit = async () => {
    if (!selectedUser || !adminUser) return;
    
    try {
      await updateUser({
        userId: selectedUser._id,
        name: editForm.name,
        role: editForm.role,
        isActive: editForm.isActive,
        updatedBy: adminUser._id,
      });
      toast.success("User updated successfully!");
      setShowEditModal(false);
      setSelectedUser(null);
    } catch (error) {
      toast.error(error.message);
    }
  };

  const confirmDelete = async () => {
    if (!selectedUser || !adminUser) return;
    
    try {
      await deleteUser({ 
        userId: selectedUser._id, 
        deletedBy: adminUser._id,
        reason: "Deleted via admin panel"
      });
      toast.success("User moved to trash!");
      setShowDeleteModal(false);
      setSelectedUser(null);
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleToggleStatus = async (user) => {
    if (!adminUser) return;
    
    try {
      const result = await toggleUserStatus({ 
        userId: user._id, 
        toggledBy: adminUser._id 
      });
      toast.success(`User ${result.newStatus ? 'activated' : 'deactivated'} successfully!`);
    } catch (error) {
      toast.error(error.message);
    }
  };

  const confirmSetPassword = async () => {
    if (!selectedUser || !adminUser) return;
    
    try {
      const result = await setUserPassword({
        userId: selectedUser._id,
        newPassword,
        setBy: adminUser._id,
        storeForViewing: true, // Store password so super admin can view it
      });
      toast.success("Password updated successfully! You can now view the real password.");
      setShowSetPasswordModal(false);
      setNewPassword("");
      // Keep selectedUser and show password modal to view the new password
      setShowPasswordModal(true);
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleClearTempPassword = async (userId) => {
    if (!adminUser) return;
    
    try {
      await clearTempPassword({ userId, clearedBy: adminUser._id });
      toast.success("Temporary password cleared for security!");
    } catch (error) {
      toast.error(error.message);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      toast.success("Copied to clipboard!");
    }).catch(() => {
      toast.error("Failed to copy");
    });
  };

  const getRoleColor = (role) => {
    switch (role) {
      case "super_admin": return "bg-red-100 text-red-800 border-red-200";
      case "admin": return "bg-blue-100 text-blue-800 border-blue-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case "super_admin": return <FiShield size={14} />;
      case "admin": return <FiUserCheck size={14} />;
      default: return <FiUser size={14} />;
    }
  };

  if (allUsers === undefined) {
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
          <FiUsers className="text-2xl text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
            <p className="text-gray-600">
              {isSuperAdmin ? "Manage all users, edit roles, and delete accounts" : "View all registered users"}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-600">Total Users</p>
          <p className="text-2xl font-bold text-blue-600">{allUsers?.length || 0}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6 space-y-4">
        <form autoComplete="off">
          <div className="grid md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              name="userSearch"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck="false"
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Role Filter */}
          <div className="relative">
            <FiFilter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Roles</option>
              <option value="user">Users</option>
              <option value="admin">Admins</option>
              <option value="super_admin">Super Admins</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="relative">
            <FiFilter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          {/* Stats */}
          <div className="text-sm text-gray-600">
            Showing {filteredUsers.length} of {allUsers?.length || 0} users
          </div>
          </div>
        </form>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Joined
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.map((user) => (
                <motion.tr
                  key={user._id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="hover:bg-gray-50"
                >
                  {/* User Info */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        {user.photoUrl ? (
                          <img src={user.photoUrl} alt="" className="h-10 w-10 rounded-full object-cover" />
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                            <FiUser className="text-gray-600" />
                          </div>
                        )}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{user.name || "No name"}</div>
                        <div className="text-sm text-gray-500 flex items-center gap-1">
                          <FiMail size={12} />
                          <span>{user.email}</span>
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Role */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${getRoleColor(user.role)}`}>
                      {getRoleIcon(user.role)}
                      {user.role === "super_admin" ? "Super Admin" : user.role === "admin" ? "Admin" : "User"}
                    </span>
                  </td>

                  {/* Status */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      user.isActive 
                        ? "bg-green-100 text-green-800" 
                        : "bg-red-100 text-red-800"
                    }`}>
                      {user.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>

                  {/* Contact */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="space-y-1">
                      {user.phoneNumber && (
                        <div className="flex items-center gap-1">
                          <FiPhone size={12} />
                          {user.phoneNumber}
                        </div>
                      )}
                      {user.permanentAddress && (
                        <div className="flex items-center gap-1">
                          <FiMapPin size={12} />
                          {user.permanentAddress.city}, {user.permanentAddress.state}
                        </div>
                      )}
                    </div>
                  </td>

                  {/* Joined Date */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <FiCalendar size={12} />
                      {new Date(user.createdAt).toLocaleDateString()}
                    </div>
                  </td>

                  {/* Actions */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center gap-2">
                      {/* View Details */}
                      <button className="text-blue-600 hover:text-blue-900">
                        <FiEye size={16} />
                      </button>

                      {/* Super Admin Actions */}
                      {isSuperAdmin && user.role !== "super_admin" && (
                        <>
                          {/* Toggle Status */}
                          <button
                            onClick={() => handleToggleStatus(user)}
                            className={`${user.isActive ? "text-red-600 hover:text-red-900" : "text-green-600 hover:text-green-900"}`}
                            title={user.isActive ? "Deactivate User" : "Activate User"}
                          >
                            {user.isActive ? <FiToggleRight size={16} /> : <FiToggleLeft size={16} />}
                          </button>

                          {/* View Password */}
                          <button
                            onClick={() => handleViewPassword(user)}
                            className="text-purple-600 hover:text-purple-900"
                            title="View Password Hash"
                          >
                            <FiLock size={16} />
                          </button>

                          {/* Set Password */}
                          <button
                            onClick={() => handleSetPassword(user)}
                            className="text-blue-600 hover:text-blue-900"
                            title="Set New Password"
                          >
                            <FiKey size={16} />
                          </button>

                          {/* Reactivate */}
                          {!user.isActive && (
                            <button
                              onClick={() => handleReactivate(user)}
                              className="text-green-600 hover:text-green-900"
                              title="Reactivate User Account"
                            >
                              <FiUserCheck size={16} />
                            </button>
                          )}

                          {/* Edit */}
                          <button
                            onClick={() => handleEdit(user)}
                            className="text-orange-600 hover:text-orange-900"
                            title="Edit User"
                          >
                            <FiEdit3 size={16} />
                          </button>

                          {/* Delete */}
                          <button
                            onClick={() => handleDelete(user)}
                            className="text-red-600 hover:text-red-900"
                            title="Delete User"
                          >
                            <FiTrash2 size={16} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Modal */}
      {showEditModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Edit User</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Name</label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                  autoComplete="off"
                  className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Role</label>
                <select
                  value={editForm.role}
                  onChange={(e) => setEditForm({...editForm, role: e.target.value})}
                  className="mt-1 w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                  <option value="super_admin">Super Admin</option>
                </select>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={editForm.isActive}
                  onChange={(e) => setEditForm({...editForm, isActive: e.target.checked})}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label className="ml-2 text-sm font-medium text-gray-700">Active</label>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={confirmEdit}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
              >
                Save Changes
              </button>
              <button
                onClick={() => setShowEditModal(false)}
                className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Delete User</h3>
            <p className="text-gray-600 mb-6">
                              Are you sure you want to delete <strong>{selectedUser.name || "No name"}</strong> ({selectedUser.email})? 
              This action cannot be undone.
            </p>

            <div className="flex gap-3">
              <button
                onClick={confirmDelete}
                className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
              >
                Delete User
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

      {/* View Password Modal */}
      {showPasswordModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
            <div className="flex items-center gap-2 mb-4">
              <FiLock className="text-purple-600" size={20} />
              <h3 className="text-lg font-medium text-gray-900">View Password Information</h3>
            </div>

            {/* Security Warning */}
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-2 text-red-800 mb-2">
                <FiAlertTriangle size={16} />
                <strong>Security Warning</strong>
              </div>
              <p className="text-red-700 text-sm">
                This is sensitive information. Access is logged for security audit purposes.
              </p>
            </div>

            {/* User Info */}
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">User</p>
                  <p className="font-medium">{selectedUser.name || "No name"} ({selectedUser.email})</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Role</p>
                  <p className="font-medium capitalize">{selectedUser.role}</p>
                </div>
              </div>
            </div>

            {/* Password Information */}
            {viewUserPassword && viewTempPassword ? (
              <div className="space-y-4">
                {/* Real Password (if available) */}
                {viewTempPassword.tempPassword ? (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-medium text-green-700">🔓 Real Password</label>
                      <div className="flex gap-2">
                        <button
                          onClick={() => copyToClipboard(viewTempPassword.tempPassword)}
                          className="flex items-center gap-1 text-blue-600 hover:text-blue-700 text-sm"
                        >
                          <FiCopy size={12} />
                          Copy
                        </button>
                        <button
                          onClick={() => handleClearTempPassword(selectedUser._id)}
                          className="flex items-center gap-1 text-red-600 hover:text-red-700 text-sm"
                        >
                          <FiTrash2 size={12} />
                          Clear
                        </button>
                      </div>
                    </div>
                    <div className="bg-green-50 border border-green-200 p-4 rounded">
                      <div className="text-lg font-mono font-bold text-green-800 mb-2">
                        {viewTempPassword.tempPassword}
                      </div>
                      <div className="text-xs text-green-600">
                        Set: {new Date(viewTempPassword.tempPasswordSetAt).toLocaleString()}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-yellow-50 border border-yellow-200 p-4 rounded">
                    <p className="text-yellow-800 text-sm">
                      ℹ️ No viewable password available. Use "Set New Password" to create a viewable password.
                    </p>
                  </div>
                )}

                {/* Password Hash */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-gray-700">🔒 Password Hash (Encrypted)</label>
                    <button
                      onClick={() => copyToClipboard(viewUserPassword.passwordHash)}
                      className="flex items-center gap-1 text-blue-600 hover:text-blue-700 text-sm"
                    >
                      <FiCopy size={12} />
                      Copy
                    </button>
                  </div>
                  <div className="bg-gray-100 p-3 rounded border font-mono text-xs break-all">
                    {viewUserPassword.passwordHash}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{viewUserPassword.note}</p>
                </div>

                <div className="text-xs text-gray-500">
                  <p>Accessed by: {viewUserPassword.accessedBy}</p>
                  <p>Accessed at: {new Date(viewUserPassword.accessedAt).toLocaleString()}</p>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center p-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
              </div>
            )}

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowPasswordModal(false)}
                className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Set Password Modal */}
      {showSetPasswordModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center gap-2 mb-4">
              <FiKey className="text-blue-600" size={20} />
              <h3 className="text-lg font-medium text-gray-900">Set New Password</h3>
            </div>

            {/* User Info */}
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <p className="text-sm text-gray-600">Setting password for:</p>
              <p className="font-medium">{selectedUser.name || "No name"} ({selectedUser.email})</p>
            </div>

            {/* Warning */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
              <div className="flex items-center gap-2 text-yellow-800">
                <FiAlertTriangle size={14} />
                <span className="text-sm">This will overwrite the user's current password.</span>
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password (min 8 characters)"
                  autoComplete="new-password"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  minLength={8}
                  required
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={confirmSetPassword}
                disabled={!newPassword || newPassword.length < 8}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed"
              >
                Set Password
              </button>
              <button
                onClick={() => setShowSetPasswordModal(false)}
                className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 
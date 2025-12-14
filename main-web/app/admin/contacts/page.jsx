"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Mail,
  Calendar,
  Trash2,
  RefreshCw,
  Eye,
  EyeOff,
  User,
  Reply,
  X,
  Send,
} from "lucide-react";

export default function ContactsPage() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("all"); // all, unread, read
  const [replyModal, setReplyModal] = useState(null);
  const [replyMessage, setReplyMessage] = useState("");
  const [sendingReply, setSendingReply] = useState(false);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/contact");
      const data = await response.json();

      if (data.messages) {
        setMessages(data.messages);
      }
      setError(null);
    } catch (err) {
      setError("Failed to load messages");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, []);

  const markAsRead = async (id) => {
    try {
      const response = await fetch("/api/contact", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });

      if (response.ok) {
        setMessages(
          messages.map((msg) => (msg.id === id ? { ...msg, read: true } : msg))
        );
      }
    } catch (error) {
      console.error("Error marking as read:", error);
    }
  };

  const deleteMessage = async (id) => {
    if (!confirm("Are you sure you want to delete this message?")) return;

    try {
      const response = await fetch(`/api/contact?id=${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setMessages(messages.filter((msg) => msg.id !== id));
      }
    } catch (error) {
      console.error("Error deleting message:", error);
    }
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const filteredMessages = messages.filter((msg) => {
    if (filter === "unread") return !msg.read;
    if (filter === "read") return msg.read;
    return true;
  });

  const unreadCount = messages.filter((msg) => !msg.read).length;

  const handleReply = async () => {
    if (!replyMessage.trim()) {
      alert("Please enter a reply message");
      return;
    }

    setSendingReply(true);
    try {
      const response = await fetch("/api/send-reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: replyModal.email,
          name: replyModal.name,
          originalMessage: replyModal.message,
          reply: replyMessage,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        alert("Reply sent successfully!");
        setReplyModal(null);
        setReplyMessage("");
        markAsRead(replyModal.id);
      } else {
        alert(data.error || "Failed to send reply");
      }
    } catch (error) {
      console.error("Error sending reply:", error);
      alert("Failed to send reply. Please try again.");
    } finally {
      setSendingReply(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-2xl font-light text-gray-900 mb-2">
              Contact Messages
            </h1>
            <p className="text-sm font-light text-gray-600">
              {messages.length} total messages
              {unreadCount > 0 && (
                <span className="ml-2 px-2 py-1 bg-red-100 text-red-600 rounded-full text-xs">
                  {unreadCount} unread
                </span>
              )}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Filter Buttons */}
            <div className="flex gap-2">
              <button
                onClick={() => setFilter("all")}
                className={`px-3 py-1.5 rounded-lg text-xs font-light transition-colors ${
                  filter === "all"
                    ? "bg-black text-white"
                    : "bg-white text-gray-600 border border-gray-200"
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilter("unread")}
                className={`px-3 py-1.5 rounded-lg text-xs font-light transition-colors ${
                  filter === "unread"
                    ? "bg-black text-white"
                    : "bg-white text-gray-600 border border-gray-200"
                }`}
              >
                Unread
              </button>
              <button
                onClick={() => setFilter("read")}
                className={`px-3 py-1.5 rounded-lg text-xs font-light transition-colors ${
                  filter === "read"
                    ? "bg-black text-white"
                    : "bg-white text-gray-600 border border-gray-200"
                }`}
              >
                Read
              </button>
            </div>

            <button
              onClick={fetchMessages}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg text-sm font-light hover:bg-gray-800 transition-colors disabled:opacity-50"
            >
              <RefreshCw
                className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
              />
              Refresh
            </button>
          </div>
        </div>

        {/* Loading State */}
        {loading && messages.length === 0 && (
          <div className="text-center py-12">
            <div className="w-8 h-8 border-2 border-gray-300 border-t-black rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-sm font-light text-gray-600">
              Loading messages...
            </p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-sm font-light text-red-600">{error}</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredMessages.length === 0 && !error && (
          <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
            <Mail className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-base font-light text-gray-600 mb-2">
              {filter === "all"
                ? "No messages yet"
                : filter === "unread"
                ? "No unread messages"
                : "No read messages"}
            </p>
            <p className="text-xs font-light text-gray-500">
              Contact messages will appear here
            </p>
          </div>
        )}

        {/* Messages List */}
        {filteredMessages.length > 0 && (
          <div className="space-y-4">
            {filteredMessages.map((message, index) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`bg-white rounded-lg border-2 p-6 hover:shadow-md transition-all ${
                  message.read ? "border-gray-200" : "border-black"
                }`}
              >
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <User className="w-5 h-5 text-gray-600" />
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-sm font-light text-gray-900">
                          {message.name}
                        </h3>
                        {!message.read && (
                          <span className="px-2 py-0.5 bg-red-100 text-red-600 rounded-full text-xs font-light">
                            New
                          </span>
                        )}
                      </div>

                      <a
                        href={`mailto:${message.email}`}
                        className="text-xs font-light text-gray-600 hover:text-black transition-colors"
                      >
                        {message.email}
                      </a>

                      <div className="flex items-center gap-2 text-xs font-light text-gray-500 mt-2">
                        <Calendar className="w-3 h-3" />
                        {formatDate(message.timestamp)}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setReplyModal(message)}
                      className="p-2 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Reply"
                    >
                      <Reply className="w-4 h-4 text-blue-600" />
                    </button>

                    {!message.read && (
                      <button
                        onClick={() => markAsRead(message.id)}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Mark as read"
                      >
                        <Eye className="w-4 h-4 text-gray-600" />
                      </button>
                    )}

                    <button
                      onClick={() => deleteMessage(message.id)}
                      className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete message"
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </button>
                  </div>
                </div>

                <div className="pl-13">
                  <p className="text-sm font-light text-gray-700 leading-relaxed">
                    {message.message}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Reply Modal */}
        {replyModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-light text-gray-900">
                    Reply to {replyModal.name}
                  </h2>
                  <button
                    onClick={() => {
                      setReplyModal(null);
                      setReplyMessage("");
                    }}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Original Message */}
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <p className="text-xs font-light text-gray-500 mb-2">
                    Original Message:
                  </p>
                  <p className="text-sm font-light text-gray-700">
                    {replyModal.message}
                  </p>
                </div>

                {/* Reply Form */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-light text-gray-700 mb-2">
                      To: {replyModal.email}
                    </label>
                  </div>

                  <div>
                    <label className="block text-sm font-light text-gray-700 mb-2">
                      Your Reply
                    </label>
                    <textarea
                      value={replyMessage}
                      onChange={(e) => setReplyMessage(e.target.value)}
                      rows={8}
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-black focus:ring-2 focus:ring-black/20 outline-none transition-all resize-none text-sm font-light"
                      placeholder="Type your reply here..."
                    />
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={handleReply}
                      disabled={sendingReply || !replyMessage.trim()}
                      className="flex-1 bg-black text-white py-3 rounded-xl font-light text-sm flex items-center justify-center gap-2 hover:bg-gray-800 transition-colors disabled:opacity-50"
                    >
                      {sendingReply ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          Send Reply
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => {
                        setReplyModal(null);
                        setReplyMessage("");
                      }}
                      className="px-6 py-3 border-2 border-gray-200 rounded-xl font-light text-sm hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}

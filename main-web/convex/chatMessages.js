import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { sanitizeMessage } from "./utils/helpers";

// Send a new message
export const sendMessage = mutation({
  args: {
    sessionId: v.string(),
    senderId: v.optional(v.id("users")),
    senderType: v.string(), // 'user', 'admin', 'system'
    senderName: v.string(),
    message: v.string(),
    messageType: v.optional(v.string()), // defaults to 'text'
  },
  handler: async (ctx, args) => {
    // Verify session exists
    const session = await ctx.db
      .query("chatSessions")
      .withIndex("by_session_id", (q) => q.eq("sessionId", args.sessionId))
      .first();

    if (!session) {
      throw new Error("Chat session not found");
    }

    // Sanitize message content
    const sanitizedMessage = sanitizeMessage(args.message);
    const now = new Date().toISOString();

    // Create message
    const messageId = await ctx.db.insert("chatMessages", {
      sessionId: args.sessionId,
      senderId: args.senderId,
      senderType: args.senderType,
      senderName: args.senderName,
      message: sanitizedMessage,
      messageType: args.messageType || "text",
      isRead: args.senderType === "admin", // Admin messages are auto-read
      createdAt: now,
    });

    // Update session's last message time
    await ctx.db.patch(session._id, {
      lastMessageAt: now,
      updatedAt: now,
    });

    // If this is a user message and session isn't assigned, mark as waiting
    if (args.senderType === "user" && !session.assignedTo && session.status === "active") {
      await ctx.db.patch(session._id, {
        status: "waiting",
      });
    }

    return { messageId, createdAt: now };
  },
});

// Get messages for a chat session with pagination
export const getSessionMessages = query({
  args: {
    sessionId: v.string(),
    limit: v.optional(v.number()),
    cursor: v.optional(v.string()), // createdAt timestamp for pagination
  },
  handler: async (ctx, args) => {
    let query = ctx.db
      .query("chatMessages")
      .withIndex("by_session_created", (q) => q.eq("sessionId", args.sessionId));

    // Add cursor-based pagination
    if (args.cursor) {
      query = query.filter((q) => q.lt(q.field("createdAt"), args.cursor));
    }

    const messages = await query
      .order("desc")
      .take(args.limit || 50);

    // Return in chronological order (oldest first)
    return messages.reverse();
  },
});

// Get latest messages for a session (for real-time updates)
export const getLatestMessages = query({
  args: {
    sessionId: v.string(),
    since: v.optional(v.string()), // timestamp to get messages after
  },
  handler: async (ctx, args) => {
    let query = ctx.db
      .query("chatMessages")
      .withIndex("by_session_created", (q) => q.eq("sessionId", args.sessionId));

    if (args.since) {
      query = query.filter((q) => q.gt(q.field("createdAt"), args.since));
    }

    const messages = await query.order("asc").collect();
    return messages;
  },
});

// Mark messages as read
export const markMessagesAsRead = mutation({
  args: {
    sessionId: v.string(),
    readerId: v.optional(v.id("users")),
    readerType: v.string(), // 'user' or 'admin'
  },
  handler: async (ctx, args) => {
    const now = new Date().toISOString();
    
    // Get unread messages from the opposite sender type
    const targetSenderType = args.readerType === "admin" ? "user" : "admin";
    
    const unreadMessages = await ctx.db
      .query("chatMessages")
      .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
      .filter((q) => 
        q.and(
          q.eq(q.field("isRead"), false),
          q.eq(q.field("senderType"), targetSenderType)
        )
      )
      .collect();

    // Mark all unread messages as read
    const updatePromises = unreadMessages.map(message =>
      ctx.db.patch(message._id, {
        isRead: true,
        readAt: now,
      })
    );

    await Promise.all(updatePromises);

    return { markedCount: unreadMessages.length };
  },
});

// Get unread message count for a session
export const getUnreadCount = query({
  args: {
    sessionId: v.string(),
    forUserType: v.string(), // 'user' or 'admin'
  },
  handler: async (ctx, args) => {
    // Count unread messages from the opposite sender type
    const targetSenderType = args.forUserType === "admin" ? "user" : "admin";
    
    const unreadMessages = await ctx.db
      .query("chatMessages")
      .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
      .filter((q) => 
        q.and(
          q.eq(q.field("isRead"), false),
          q.eq(q.field("senderType"), targetSenderType)
        )
      )
      .collect();

    return unreadMessages.length;
  },
});

// Get all unread messages for admin (across all sessions)
export const getAdminUnreadMessages = query({
  args: { adminId: v.optional(v.id("users")) },
  handler: async (ctx, args) => {
    // Get all unread user messages
    const unreadMessages = await ctx.db
      .query("chatMessages")
      .withIndex("by_read_status", (q) => q.eq("isRead", false))
      .filter((q) => q.eq(q.field("senderType"), "user"))
      .collect();

    // Group by session and get session info
    const sessionGroups = {};
    
    for (const message of unreadMessages) {
      if (!sessionGroups[message.sessionId]) {
        const session = await ctx.db
          .query("chatSessions")
          .withIndex("by_session_id", (q) => q.eq("sessionId", message.sessionId))
          .first();

        if (session && session.isActive) {
          // Only include if admin is assigned to this session or no admin assigned
          if (!args.adminId || !session.assignedTo || session.assignedTo === args.adminId) {
            sessionGroups[message.sessionId] = {
              session,
              messages: [],
            };
          }
        }
      }

      if (sessionGroups[message.sessionId]) {
        sessionGroups[message.sessionId].messages.push(message);
      }
    }

    return Object.values(sessionGroups);
  },
});

// Delete a message (soft delete)
export const deleteMessage = mutation({
  args: {
    messageId: v.id("chatMessages"),
    deletedBy: v.id("users"),
  },
  handler: async (ctx, args) => {
    const message = await ctx.db.get(args.messageId);
    
    if (!message) {
      throw new Error("Message not found");
    }

    // Only allow deletion by sender or admin
    const user = await ctx.db.get(args.deletedBy);
    const isAdmin = user?.role === "admin" || user?.role === "super_admin";
    const isSender = message.senderId === args.deletedBy;

    if (!isAdmin && !isSender) {
      throw new Error("Not authorized to delete this message");
    }

    await ctx.db.patch(args.messageId, {
      isDeleted: true,
      message: "[Message deleted]",
    });

    return { success: true };
  },
});

// Edit a message
export const editMessage = mutation({
  args: {
    messageId: v.id("chatMessages"),
    newMessage: v.string(),
    editedBy: v.id("users"),
  },
  handler: async (ctx, args) => {
    const message = await ctx.db.get(args.messageId);
    
    if (!message) {
      throw new Error("Message not found");
    }

    // Only allow editing by sender within 5 minutes
    const messageTime = new Date(message.createdAt);
    const now = new Date();
    const timeDiff = (now - messageTime) / (1000 * 60); // minutes

    if (timeDiff > 5) {
      throw new Error("Message can only be edited within 5 minutes");
    }

    if (message.senderId !== args.editedBy) {
      throw new Error("Only the sender can edit this message");
    }

    const sanitizedMessage = sanitizeMessage(args.newMessage);

    await ctx.db.patch(args.messageId, {
      message: sanitizedMessage,
      editedAt: new Date().toISOString(),
    });

    return { success: true };
  },
});
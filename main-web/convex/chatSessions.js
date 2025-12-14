import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { generateSessionId, generateTicketNumber } from "./utils/helpers";

// Create a new chat session
export const createChatSession = mutation({
  args: {
    userId: v.optional(v.id("users")),
    guestInfo: v.optional(v.object({
      name: v.string(),
      email: v.string(),
      phone: v.optional(v.string()),
    })),
    category: v.optional(v.string()),
    initialMessage: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const sessionId = generateSessionId();
    const now = new Date().toISOString();
    
    // Create chat session
    const chatSessionId = await ctx.db.insert("chatSessions", {
      sessionId,
      userId: args.userId,
      guestInfo: args.guestInfo,
      status: "active",
      priority: "medium",
      category: args.category || "general",
      assignedTo: undefined,
      createdAt: now,
      updatedAt: now,
      lastMessageAt: now,
      isActive: true,
    });

    // Create support ticket
    const ticketNumber = generateTicketNumber();
    await ctx.db.insert("supportTickets", {
      ticketNumber,
      sessionId,
      userId: args.userId,
      subject: `Chat Support - ${args.category || "General"}`,
      description: args.initialMessage || "New chat session started",
      status: "open",
      priority: "medium",
      category: args.category || "general",
      assignedTo: undefined,
      createdAt: now,
      updatedAt: now,
    });

    // If there's an initial message, create it
    if (args.initialMessage) {
      const senderName = args.userId ? 
        (await ctx.db.get(args.userId))?.name || "User" :
        args.guestInfo?.name || "Guest";

      await ctx.db.insert("chatMessages", {
        sessionId,
        senderId: args.userId,
        senderType: "user",
        senderName,
        message: args.initialMessage,
        messageType: "text",
        isRead: false,
        createdAt: now,
      });
    }

    return { sessionId, chatSessionId };
  },
});

// Get chat session by session ID
export const getChatSession = query({
  args: { sessionId: v.string() },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("chatSessions")
      .withIndex("by_session_id", (q) => q.eq("sessionId", args.sessionId))
      .first();
    
    if (!session) return null;

    // Get assigned admin info if exists
    let assignedAdmin = null;
    if (session.assignedTo) {
      assignedAdmin = await ctx.db.get(session.assignedTo);
    }

    return {
      ...session,
      assignedAdmin: assignedAdmin ? {
        id: assignedAdmin._id,
        name: assignedAdmin.name,
        email: assignedAdmin.email,
      } : null,
    };
  },
});

// Update chat session status
export const updateChatSessionStatus = mutation({
  args: {
    sessionId: v.string(),
    status: v.string(),
    assignedTo: v.optional(v.id("users")),
    priority: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("chatSessions")
      .withIndex("by_session_id", (q) => q.eq("sessionId", args.sessionId))
      .first();

    if (!session) {
      throw new Error("Chat session not found");
    }

    const updates = {
      updatedAt: new Date().toISOString(),
    };

    if (args.status) updates.status = args.status;
    if (args.assignedTo !== undefined) updates.assignedTo = args.assignedTo;
    if (args.priority) updates.priority = args.priority;

    await ctx.db.patch(session._id, updates);

    // Update corresponding support ticket
    const ticket = await ctx.db
      .query("supportTickets")
      .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
      .first();

    if (ticket) {
      const ticketUpdates = {
        updatedAt: new Date().toISOString(),
      };

      if (args.status === "closed") {
        ticketUpdates.status = "closed";
        ticketUpdates.closedAt = new Date().toISOString();
      } else if (args.assignedTo) {
        ticketUpdates.status = "in_progress";
        ticketUpdates.assignedTo = args.assignedTo;
      }

      if (args.priority) ticketUpdates.priority = args.priority;

      await ctx.db.patch(ticket._id, ticketUpdates);
    }

    return { success: true };
  },
});

// Get all active chat sessions for admin
export const getActiveChatSessions = query({
  args: {},
  handler: async (ctx, args) => {
    const sessions = await ctx.db
      .query("chatSessions")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .order("desc")
      .collect();

    // Get user info for each session
    const sessionsWithUserInfo = await Promise.all(
      sessions.map(async (session) => {
        let userInfo = null;
        if (session.userId) {
          const user = await ctx.db.get(session.userId);
          userInfo = user ? {
            id: user._id,
            name: user.name,
            email: user.email,
          } : null;
        }

        let assignedAdmin = null;
        if (session.assignedTo) {
          const admin = await ctx.db.get(session.assignedTo);
          assignedAdmin = admin ? {
            id: admin._id,
            name: admin.name,
            email: admin.email,
          } : null;
        }

        // Get last message
        const lastMessage = await ctx.db
          .query("chatMessages")
          .withIndex("by_session", (q) => q.eq("sessionId", session.sessionId))
          .order("desc")
          .first();

        return {
          ...session,
          userInfo,
          assignedAdmin,
          lastMessage: lastMessage ? {
            message: lastMessage.message,
            senderType: lastMessage.senderType,
            createdAt: lastMessage.createdAt,
          } : null,
        };
      })
    );

    return sessionsWithUserInfo;
  },
});

// Get chat sessions assigned to specific admin
export const getAssignedChatSessions = query({
  args: { adminId: v.id("users") },
  handler: async (ctx, args) => {
    const sessions = await ctx.db
      .query("chatSessions")
      .withIndex("by_assigned", (q) => q.eq("assignedTo", args.adminId))
      .filter((q) => q.neq(q.field("status"), "closed"))
      .order("desc")
      .collect();

    return sessions;
  },
});

// Close chat session
export const closeChatSession = mutation({
  args: {
    sessionId: v.string(),
    resolutionNotes: v.optional(v.string()),
    adminId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("chatSessions")
      .withIndex("by_session_id", (q) => q.eq("sessionId", args.sessionId))
      .first();

    if (!session) {
      throw new Error("Chat session not found");
    }

    const now = new Date().toISOString();

    // Update session status
    await ctx.db.patch(session._id, {
      status: "closed",
      updatedAt: now,
      isActive: false,
    });

    // Update support ticket
    const ticket = await ctx.db
      .query("supportTickets")
      .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
      .first();

    if (ticket) {
      await ctx.db.patch(ticket._id, {
        status: "closed",
        closedAt: now,
        updatedAt: now,
        resolutionNotes: args.resolutionNotes,
      });
    }

    // Add system message
    await ctx.db.insert("chatMessages", {
      sessionId: args.sessionId,
      senderId: args.adminId,
      senderType: "system",
      senderName: "System",
      message: "Chat session has been closed.",
      messageType: "system",
      isRead: true,
      createdAt: now,
    });

    return { success: true };
  },
});
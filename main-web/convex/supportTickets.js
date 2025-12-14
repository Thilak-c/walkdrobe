import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Get all support tickets with filtering
export const getSupportTickets = query({
  args: {
    status: v.optional(v.string()),
    priority: v.optional(v.string()),
    category: v.optional(v.string()),
    assignedTo: v.optional(v.id("users")),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let query = ctx.db.query("supportTickets");

    // Apply filters
    if (args.status) {
      query = query.withIndex("by_status", (q) => q.eq("status", args.status));
    } else if (args.assignedTo) {
      query = query.withIndex("by_assigned", (q) => q.eq("assignedTo", args.assignedTo));
    } else if (args.priority) {
      query = query.withIndex("by_priority", (q) => q.eq("priority", args.priority));
    } else if (args.category) {
      query = query.withIndex("by_category", (q) => q.eq("category", args.category));
    } else {
      query = query.withIndex("by_created");
    }

    let tickets = await query.order("desc").take(args.limit || 50);

    // Apply additional filters if needed
    if (args.status && (args.priority || args.category || args.assignedTo)) {
      tickets = tickets.filter(ticket => {
        if (args.priority && ticket.priority !== args.priority) return false;
        if (args.category && ticket.category !== args.category) return false;
        if (args.assignedTo && ticket.assignedTo !== args.assignedTo) return false;
        return true;
      });
    }

    return tickets;
  },
});
// Get a specific support ticket by ticket number
export const getTicketByNumber = query({
  args: { ticketNumber: v.string() },
  handler: async (ctx, args) => {
    const ticket = await ctx.db
      .query("supportTickets")
      .withIndex("by_ticket_number", (q) => q.eq("ticketNumber", args.ticketNumber))
      .first();

    if (!ticket) return null;

    // Get associated chat session
    const session = await ctx.db
      .query("chatSessions")
      .withIndex("by_session_id", (q) => q.eq("sessionId", ticket.sessionId))
      .first();

    // Get assigned admin info
    let assignedAdmin = null;
    if (ticket.assignedTo) {
      const admin = await ctx.db.get(ticket.assignedTo);
      assignedAdmin = admin ? {
        id: admin._id,
        name: admin.name,
        email: admin.email,
      } : null;
    }

    // Get user info
    let userInfo = null;
    if (ticket.userId) {
      const user = await ctx.db.get(ticket.userId);
      userInfo = user ? {
        id: user._id,
        name: user.name,
        email: user.email,
      } : null;
    }

    return {
      ...ticket,
      session,
      assignedAdmin,
      userInfo,
    };
  },
});

// Update support ticket
export const updateTicket = mutation({
  args: {
    ticketId: v.id("supportTickets"),
    status: v.optional(v.string()),
    priority: v.optional(v.string()),
    assignedTo: v.optional(v.id("users")),
    resolutionNotes: v.optional(v.string()),
    customerSatisfaction: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const ticket = await ctx.db.get(args.ticketId);
    
    if (!ticket) {
      throw new Error("Ticket not found");
    }

    const now = new Date().toISOString();
    const updates = { updatedAt: now };

    if (args.status) {
      updates.status = args.status;
      if (args.status === "resolved") {
        updates.resolvedAt = now;
      } else if (args.status === "closed") {
        updates.closedAt = now;
      }
    }

    if (args.priority) updates.priority = args.priority;
    if (args.assignedTo !== undefined) updates.assignedTo = args.assignedTo;
    if (args.resolutionNotes) updates.resolutionNotes = args.resolutionNotes;
    if (args.customerSatisfaction) updates.customerSatisfaction = args.customerSatisfaction;

    await ctx.db.patch(args.ticketId, updates);

    // Update corresponding chat session if needed
    if (args.status || args.assignedTo !== undefined || args.priority) {
      const session = await ctx.db
        .query("chatSessions")
        .withIndex("by_session_id", (q) => q.eq("sessionId", ticket.sessionId))
        .first();

      if (session) {
        const sessionUpdates = { updatedAt: now };
        
        if (args.status === "closed") {
          sessionUpdates.status = "closed";
          sessionUpdates.isActive = false;
        } else if (args.assignedTo !== undefined) {
          sessionUpdates.assignedTo = args.assignedTo;
          if (args.assignedTo && session.status === "waiting") {
            sessionUpdates.status = "active";
          }
        }

        if (args.priority) sessionUpdates.priority = args.priority;

        await ctx.db.patch(session._id, sessionUpdates);
      }
    }

    return { success: true };
  },
});
// Assign ticket to admin
export const assignTicket = mutation({
  args: {
    ticketNumber: v.string(),
    assignedTo: v.id("users"),
    assignedBy: v.id("users"),
  },
  handler: async (ctx, args) => {
    const ticket = await ctx.db
      .query("supportTickets")
      .withIndex("by_ticket_number", (q) => q.eq("ticketNumber", args.ticketNumber))
      .first();

    if (!ticket) {
      throw new Error("Ticket not found");
    }

    // Verify assignee is admin
    const assignee = await ctx.db.get(args.assignedTo);
    if (!assignee || (assignee.role !== "admin" && assignee.role !== "super_admin")) {
      throw new Error("Can only assign tickets to admin users");
    }

    const now = new Date().toISOString();

    await ctx.db.patch(ticket._id, {
      assignedTo: args.assignedTo,
      status: ticket.status === "open" ? "in_progress" : ticket.status,
      updatedAt: now,
    });

    // Update corresponding chat session
    const session = await ctx.db
      .query("chatSessions")
      .withIndex("by_session_id", (q) => q.eq("sessionId", ticket.sessionId))
      .first();

    if (session) {
      await ctx.db.patch(session._id, {
        assignedTo: args.assignedTo,
        status: session.status === "waiting" ? "active" : session.status,
        updatedAt: now,
      });
    }

    return { success: true };
  },
});

// Get ticket statistics
export const getTicketStats = query({
  args: {
    timeframe: v.optional(v.string()), // 'today', 'week', 'month'
    adminId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    let tickets = await ctx.db.query("supportTickets").collect();

    // Filter by timeframe
    if (args.timeframe) {
      const now = new Date();
      let startDate;

      switch (args.timeframe) {
        case 'today':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        default:
          startDate = new Date(0);
      }

      tickets = tickets.filter(ticket => 
        new Date(ticket.createdAt) >= startDate
      );
    }

    // Filter by admin if specified
    if (args.adminId) {
      tickets = tickets.filter(ticket => ticket.assignedTo === args.adminId);
    }

    const stats = {
      total: tickets.length,
      open: tickets.filter(t => t.status === "open").length,
      inProgress: tickets.filter(t => t.status === "in_progress").length,
      resolved: tickets.filter(t => t.status === "resolved").length,
      closed: tickets.filter(t => t.status === "closed").length,
      byPriority: {
        low: tickets.filter(t => t.priority === "low").length,
        medium: tickets.filter(t => t.priority === "medium").length,
        high: tickets.filter(t => t.priority === "high").length,
        urgent: tickets.filter(t => t.priority === "urgent").length,
      },
      byCategory: {},
    };

    // Calculate category stats
    tickets.forEach(ticket => {
      stats.byCategory[ticket.category] = (stats.byCategory[ticket.category] || 0) + 1;
    });

    // Calculate average resolution time for resolved tickets
    const resolvedTickets = tickets.filter(t => t.resolvedAt);
    if (resolvedTickets.length > 0) {
      const totalResolutionTime = resolvedTickets.reduce((sum, ticket) => {
        const created = new Date(ticket.createdAt);
        const resolved = new Date(ticket.resolvedAt);
        return sum + (resolved - created);
      }, 0);
      
      stats.avgResolutionTime = Math.round(totalResolutionTime / resolvedTickets.length / (1000 * 60 * 60)); // hours
    } else {
      stats.avgResolutionTime = 0;
    }

    return stats;
  },
});

// Search tickets
export const searchTickets = query({
  args: {
    searchTerm: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const tickets = await ctx.db.query("supportTickets").collect();
    
    const searchTerm = args.searchTerm.toLowerCase();
    const filteredTickets = tickets.filter(ticket => 
      ticket.ticketNumber.toLowerCase().includes(searchTerm) ||
      ticket.subject.toLowerCase().includes(searchTerm) ||
      ticket.description.toLowerCase().includes(searchTerm) ||
      ticket.category.toLowerCase().includes(searchTerm)
    );

    return filteredTickets
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, args.limit || 20);
  },
});
import { query } from "./_generated/server";

// Query to get all users for backup - FULL DATA (exact mirror)
export const getAllUsers = query({
  args: {},
  handler: async (ctx) => {
    const users = await ctx.db.query("users").collect();
    
    // Return ALL user data exactly as-is for full sync
    return users.map((user) => {
      const { _id, _creationTime, ...userData } = user;
      return {
        originalId: _id,
        originalCreationTime: _creationTime,
        ...userData, // All fields including password, sessionToken, etc.
      };
    });
  },
});

// Query to get all products for backup - FULL DATA
export const getAllProducts = query({
  args: {},
  handler: async (ctx) => {
    const products = await ctx.db.query("products").collect();
    
    return products.map((product) => {
      const { _id, _creationTime, ...productData } = product;
      return {
        originalId: _id,
        originalCreationTime: _creationTime,
        ...productData, // All fields exactly as-is
      };
    });
  },
});

// Query to get all orders for backup - FULL DATA
export const getAllOrders = query({
  args: {},
  handler: async (ctx) => {
    const orders = await ctx.db.query("orders").collect();
    
    return orders.map((order) => {
      const { _id, _creationTime, ...orderData } = order;
      return {
        originalId: _id,
        originalCreationTime: _creationTime,
        ...orderData, // All fields exactly as-is
      };
    });
  },
});

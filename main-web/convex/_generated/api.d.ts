/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as analytics from "../analytics.js";
import type * as analyticsProgressive from "../analyticsProgressive.js";
import type * as auth from "../auth.js";
import type * as backup from "../backup.js";
import type * as cart from "../cart.js";
import type * as category from "../category.js";
import type * as chatMessages from "../chatMessages.js";
import type * as chatSessions from "../chatSessions.js";
import type * as collections from "../collections.js";
import type * as crons from "../crons.js";
import type * as dailyAccess from "../dailyAccess.js";
import type * as emailNotifications from "../emailNotifications.js";
import type * as emailService from "../emailService.js";
import type * as insys from "../insys.js";
import type * as inventory from "../inventory.js";
import type * as mutations_shares from "../mutations/shares.js";
import type * as orders from "../orders.js";
import type * as products from "../products.js";
import type * as reportGenerator from "../reportGenerator.js";
import type * as reportTemplates from "../reportTemplates.js";
import type * as reports from "../reports.js";
import type * as reviews from "../reviews.js";
import type * as sampleTemplates from "../sampleTemplates.js";
import type * as seedCollections from "../seedCollections.js";
import type * as supportTickets from "../supportTickets.js";
import type * as users from "../users.js";
import type * as utils_helpers from "../utils/helpers.js";
import type * as views from "../views.js";
import type * as wishlist from "../wishlist.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  analytics: typeof analytics;
  analyticsProgressive: typeof analyticsProgressive;
  auth: typeof auth;
  backup: typeof backup;
  cart: typeof cart;
  category: typeof category;
  chatMessages: typeof chatMessages;
  chatSessions: typeof chatSessions;
  collections: typeof collections;
  crons: typeof crons;
  dailyAccess: typeof dailyAccess;
  emailNotifications: typeof emailNotifications;
  emailService: typeof emailService;
  insys: typeof insys;
  inventory: typeof inventory;
  "mutations/shares": typeof mutations_shares;
  orders: typeof orders;
  products: typeof products;
  reportGenerator: typeof reportGenerator;
  reportTemplates: typeof reportTemplates;
  reports: typeof reports;
  reviews: typeof reviews;
  sampleTemplates: typeof sampleTemplates;
  seedCollections: typeof seedCollections;
  supportTickets: typeof supportTickets;
  users: typeof users;
  "utils/helpers": typeof utils_helpers;
  views: typeof views;
  wishlist: typeof wishlist;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};

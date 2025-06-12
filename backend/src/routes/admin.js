const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/auth");
const adminMiddleware = require("../middleware/admin");
const { supabase, supabaseAdmin } = require("../lib/supabase");

// Apply authentication middleware to all routes
router.use(authMiddleware);

// Product Management
router.put(
  "/products/:id",
  [authMiddleware, adminMiddleware],
  async (req, res) => {
    try {
      console.log("PUT /api/admin/products/:id - Request body:", req.body);
      console.log("User:", req.user);
      const { id } = req.params;
      const {
        name,
        description,
        price,
        currency,
        category,
        thumbnail,
        price_type,
        features,
        prompt,
        expertise,
        personality,
        style,
      } = req.body;
      const updatePayload = {
        name,
        description,
        price,
        currency,
        category,
        thumbnail,
        price_type,
        features,
        prompt,
        expertise,
        personality,
        style,
      };
      console.log("Update payload:", updatePayload);
      const { data, error } = await supabaseAdmin
        .from("products")
        .update(updatePayload)
        .eq("id", id)
        .select();
      if (error) {
        console.error("Supabase error in product update:", error);
        throw error;
      }
      if (!data || data.length === 0) {
        console.error("No product found to update for id:", id);
        return res.status(404).json({ error: "Product not found" });
      }
      if (data.length > 1) {
        console.error("Multiple products updated for id:", id);
        return res
          .status(500)
          .json({ error: "Multiple products updated, expected one." });
      }
      console.log("Product updated successfully:", data[0]);
      res.json(data[0]);
    } catch (error) {
      console.error("Error in PUT /api/admin/products/:id:", error);
      res.status(500).json({ error: error.message });
    }
  },
);

router.delete(
  "/products/:id",
  [authMiddleware, adminMiddleware],
  async (req, res) => {
    try {
      console.log(
        "DELETE /api/admin/products/:id - Product ID:",
        req.params.id,
      );
      console.log("User:", req.user);
      const { id } = req.params;
      const { error } = await supabaseAdmin
        .from("products")
        .delete()
        .eq("id", id);
      if (error) {
        console.error("Supabase error in product deletion:", error);
        throw error;
      }
      console.log("Product deleted successfully");
      res.json({ message: "Product deleted successfully" });
    } catch (error) {
      console.error("Error in DELETE /api/admin/products/:id:", error);
      res.status(500).json({ error: error.message });
    }
  },
);

router.get(
  "/products/:id",
  [authMiddleware, adminMiddleware],
  async (req, res) => {
    try {
      const { id } = req.params;
      console.log(
        "GET /api/admin/products/:id - Looking for product with id:",
        id,
      );
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("id", id)
        .single();
      if (error) {
        console.error("Supabase error in product fetch:", error);
        return res.status(404).json({ error: "Product not found" });
      }
      console.log("Product found:", data);
      res.json(data);
    } catch (error) {
      console.error("Error in GET /api/admin/products/:id:", error);
      res.status(500).json({ error: error.message });
    }
  },
);

// Get all products (admin only)
router.get("/products", [authMiddleware, adminMiddleware], async (req, res) => {
  try {
    console.log("GET /api/admin/products - User:", req.user);
    const { data: products, error } = await supabaseAdmin
      .from("products")
      .select("*");
    if (error) {
      console.error("Supabase error in products fetch:", error);
      throw error;
    }
    console.log("Products fetched successfully:", products.length);
    res.json(products);
  } catch (error) {
    console.error("Error in GET /api/admin/products:", error);
    res.status(500).json({ error: error.message });
  }
});

// Create a new product (admin only)
router.post(
  "/products",
  [authMiddleware, adminMiddleware],
  async (req, res) => {
    try {
      console.log("POST /api/admin/products - Request body:", req.body);
      console.log("User:", req.user);
      const {
        name,
        description,
        price,
        category,
        thumbnail,
        price_type,
        currency,
        features,
        prompt,
        expertise,
        personality,
        style,
      } = req.body;

      // Basic validation
      if (
        !name ||
        !description ||
        !price ||
        !category ||
        !thumbnail ||
        !price_type ||
        !currency ||
        !prompt ||
        !expertise ||
        !personality ||
        !style
      ) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const { data, error } = await supabaseAdmin
        .from("products")
        .insert([
          {
            name,
            description,
            price,
            category,
            thumbnail,
            price_type,
            currency,
            features: features || [],
            prompt,
            expertise,
            personality,
            style,
            tier: "FREE",
          },
        ])
        .select()
        .single();

      if (error) {
        console.error("Supabase error in product creation:", error);
        throw error;
      }
      console.log("Product created successfully:", data);
      res.status(201).json(data);
    } catch (error) {
      console.error("Error in POST /api/admin/products:", error);
      res.status(500).json({ error: error.message });
    }
  },
);

// User Management
router.get("/users", [authMiddleware, adminMiddleware], async (req, res) => {
  try {
    console.log("GET /api/admin/users - Headers:", {
      authorization: req.headers.authorization,
      cookie: req.headers.cookie,
    });
    console.log("User from auth middleware:", req.user);
    console.log("Session:", req.session);

    const { data, error } = await supabase
      .from("users")
      .select("id, email, name, created_at, user_profiles(role)")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Supabase error in users fetch:", error);
      throw error;
    }

    // Flatten the role field for each user
    const usersWithRole = data.map((user) => ({
      ...user,
      role: user.user_profiles?.role || "user",
    }));

    console.log("Successfully fetched users:", {
      count: usersWithRole.length,
      firstUser: usersWithRole[0], // Log first user as sample
    });

    res.json(usersWithRole);
  } catch (error) {
    console.error("Error in GET /api/admin/users:", {
      message: error.message,
      stack: error.stack,
      code: error.code,
    });
    res.status(500).json({ error: error.message });
  }
});

router.put(
  "/users/:id/status",
  [authMiddleware, adminMiddleware],
  async (req, res) => {
    try {
      console.log("PUT /api/admin/users/:id/status - Request:", {
        userId: req.params.id,
        status: req.body.status,
        user: req.user,
      });

      const { id } = req.params;
      const { status } = req.body; // 'active', 'suspended', 'banned'

      const { data, error } = await supabase
        .from("user_profiles")
        .update({ status })
        .eq("id", id)
        .select()
        .single();

      if (error) {
        console.error("Supabase error in user status update:", error);
        throw error;
      }
      console.log("User status updated successfully:", data);
      res.json(data);
    } catch (error) {
      console.error("Error in PUT /api/admin/users/:id/status:", error);
      res.status(500).json({ error: error.message });
    }
  },
);

router.put(
  "/users/:id/role",
  [authMiddleware, adminMiddleware],
  async (req, res) => {
    try {
      console.log("PUT /api/admin/users/:id/role - Request:", {
        userId: req.params.id,
        role: req.body.role,
        user: req.user,
      });
      const { id } = req.params;
      const { role } = req.body; // 'admin' or 'user'
      if (!["admin", "user"].includes(role)) {
        return res.status(400).json({ error: "Invalid role" });
      }
      const { data, error } = await supabase
        .from("user_profiles")
        .update({ role })
        .eq("id", id)
        .select()
        .single();
      if (error) {
        console.error("Supabase error in user role update:", error);
        throw error;
      }
      console.log("User role updated successfully:", data);
      res.json(data);
    } catch (error) {
      console.error("Error in PUT /api/admin/users/:id/role:", error);
      res.status(500).json({ error: error.message });
    }
  },
);

router.put(
  "/users/:id/subscription",
  [authMiddleware, adminMiddleware],
  async (req, res) => {
    try {
      console.log("PUT /api/admin/users/:id/subscription - Request:", {
        userId: req.params.id,
        subscription: req.body.subscription,
        user: req.user,
      });

      const { id } = req.params;
      const { subscription } = req.body;

      if (!["FREE", "PRO"].includes(subscription)) {
        return res.status(400).json({ error: "Invalid subscription type" });
      }

      const { data, error } = await supabase
        .from("user_profiles")
        .update({ subscription })
        .eq("id", id)
        .select()
        .single();

      if (error) {
        console.error("Supabase error in user subscription update:", error);
        throw error;
      }
      console.log("User subscription updated successfully:", data);
      res.json(data);
    } catch (error) {
      console.error("Error in PUT /api/admin/users/:id/subscription:", error);
      res.status(500).json({ error: error.message });
    }
  },
);

// Bundle Management
router.get("/bundles", [authMiddleware, adminMiddleware], async (req, res) => {
  try {
    console.log("GET /api/admin/bundles - User:", req.user);
    // Fetch all bundles
    const { data: bundles, error: bundlesError } = await supabaseAdmin
      .from("bundles")
      .select("*");
    if (bundlesError) {
      console.error("Supabase error in bundles fetch:", bundlesError);
      throw bundlesError;
    }
    // Fetch all products (for mapping)
    const { data: products, error: productsError } = await supabaseAdmin
      .from("products")
      .select("*");
    if (productsError) {
      console.error("Supabase error in products fetch:", productsError);
      throw productsError;
    }
    // Attach product objects to each bundle
    let bundlesWithProducts = bundles.map((bundle) => ({
      ...bundle,
      products: (bundle.product_ids || [])
        .map((pid) => products.find((p) => p.id === pid))
        .filter(Boolean),
    }));
    res.json(bundlesWithProducts);
  } catch (error) {
    console.error("Error in GET /api/admin/bundles:", error);
    res.status(500).json({ error: error.message });
  }
});

router.post("/bundles", [authMiddleware, adminMiddleware], async (req, res) => {
  try {
    console.log("POST /api/admin/bundles - Request body:", req.body);
    console.log("User:", req.user);
    const { name, description, image, product_ids, tier } = req.body;

    // Basic validation
    if (
      !name ||
      !description ||
      !image ||
      !product_ids ||
      !Array.isArray(product_ids)
    ) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const { data: bundle, error: bundleError } = await supabaseAdmin
      .from("bundles")
      .insert([
        { name, description, image, tier: tier || "FREE", is_admin: true },
      ])
      .select()
      .single();

    if (bundleError) {
      console.error("Supabase error in bundle creation:", bundleError);
      throw bundleError;
    }

    // Insert into bundle_products join table
    let products = [];
    if (Array.isArray(product_ids) && product_ids.length > 0) {
      const bundleProductRows = product_ids.map((pid) => ({
        bundle_id: bundle.id,
        product_id: pid,
      }));
      await supabaseAdmin.from("bundle_products").insert(bundleProductRows);
      // Fetch products for this bundle
      const { data: fetchedProducts } = await supabaseAdmin
        .from("products")
        .select("*")
        .in("id", product_ids);
      products = fetchedProducts || [];
    }

    console.log("Bundle created successfully:", bundle);
    res.status(201).json({ ...bundle, products });
  } catch (error) {
    console.error("Error in POST /api/admin/bundles:", error);
    res.status(500).json({ error: error.message });
  }
});

router.put(
  "/bundles/:id",
  [authMiddleware, adminMiddleware],
  async (req, res) => {
    try {
      console.log("PUT /api/admin/bundles/:id - Request body:", req.body);
      console.log("User:", req.user);
      const { id } = req.params;
      // Accept both productIds and product_ids for compatibility
      const { name, description, image, tier, product_ids, productIds } =
        req.body;
      const finalProductIds = product_ids || productIds;
      // Update bundle fields (no product_ids column)
      const { data: bundle, error: bundleError } = await supabaseAdmin
        .from("bundles")
        .update({ name, description, image, tier, is_admin: true })
        .eq("id", id)
        .select()
        .single();
      if (bundleError) {
        console.error("Supabase error in bundle update:", bundleError);
        throw bundleError;
      }
      // Update bundle_products join table
      // 1. Delete existing bundle_products for this bundle
      await supabaseAdmin.from("bundle_products").delete().eq("bundle_id", id);
      // 2. Insert new bundle_products
      let products = [];
      if (Array.isArray(finalProductIds) && finalProductIds.length > 0) {
        const bundleProductRows = finalProductIds.map((pid) => ({
          bundle_id: id,
          product_id: pid,
        }));
        await supabaseAdmin.from("bundle_products").insert(bundleProductRows);
        // Fetch products for this bundle
        const { data: fetchedProducts } = await supabaseAdmin
          .from("products")
          .select("*")
          .in("id", finalProductIds);
        products = fetchedProducts || [];
      }
      console.log("Bundle updated successfully:", bundle);
      res.json({ ...bundle, products });
    } catch (error) {
      console.error("Error in PUT /api/admin/bundles/:id:", error);
      res.status(500).json({ error: error.message });
    }
  },
);

router.delete(
  "/bundles/:id",
  [authMiddleware, adminMiddleware],
  async (req, res) => {
    try {
      console.log("DELETE /api/admin/bundles/:id - Bundle ID:", req.params.id);
      console.log("User:", req.user);
      const { id } = req.params;

      const { error: bundleError } = await supabaseAdmin
        .from("bundles")
        .delete()
        .eq("id", id);

      if (bundleError) {
        console.error("Supabase error in bundle deletion:", bundleError);
        throw bundleError;
      }

      console.log("Bundle deleted successfully");
      res.json({ message: "Bundle deleted successfully" });
    } catch (error) {
      console.error("Error in DELETE /api/admin/bundles/:id:", error);
      res.status(500).json({ error: error.message });
    }
  },
);

// Get analytics data
router.get(
  "/analytics",
  [authMiddleware, adminMiddleware],
  async (req, res) => {
    console.error("ANALYTICS ROUTE HIT");
    console.log("HIT /api/admin/analytics");
    try {
      console.log("Fetching total users...");
      const { count: totalUsers, error: usersError } = await supabaseAdmin
        .from("users")
        .select("*", { count: "exact", head: true });
      if (usersError) console.error("Supabase users error:", usersError);
      console.log("Total users:", totalUsers);

      console.log("Fetching active users...");
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const { count: activeUsers, error: activeUsersError } =
        await supabaseAdmin
          .from("users")
          .select("*", { count: "exact", head: true })
          .gte("last_login", thirtyDaysAgo.toISOString());
      if (activeUsersError)
        console.error("Supabase active users error:", activeUsersError);
      console.log("Active users:", activeUsers);

      console.log("Fetching total revenue...");
      const { data: revenueData, error: revenueError } = await supabaseAdmin
        .from("payments")
        .select("amount")
        .eq("status", "completed");
      if (revenueError) console.error("Supabase revenue error:", revenueError);
      console.log("Revenue data:", revenueData);

      const totalRevenue = revenueData.reduce(
        (sum, payment) => sum + payment.amount,
        0,
      );
      console.log("Total revenue:", totalRevenue);

      console.log("Fetching monthly revenue...");
      const { data: monthlyRevenue, error: monthlyRevenueError } =
        await supabaseAdmin
          .from("payments")
          .select("amount, created_at")
          .eq("status", "completed")
          .order("created_at", { ascending: true });
      if (monthlyRevenueError)
        console.error("Supabase monthly revenue error:", monthlyRevenueError);
      console.log("Monthly revenue data:", monthlyRevenue);

      const monthlyRevenueData = monthlyRevenue.reduce((acc, payment) => {
        const month = new Date(payment.created_at).toLocaleString("default", {
          month: "short",
        });
        if (!acc[month]) {
          acc[month] = 0;
        }
        acc[month] += payment.amount;
        return acc;
      }, {});
      const monthlyRevenueArray = Object.entries(monthlyRevenueData).map(
        ([month, amount]) => ({
          month,
          amount,
        }),
      );
      console.log("Monthly revenue array:", monthlyRevenueArray);

      console.log("Fetching product usage...");
      const { data: productUsage, error: productUsageError } =
        await supabaseAdmin
          .from("product_usage")
          .select("product_id, count")
          .order("count", { ascending: false })
          .limit(5);
      if (productUsageError)
        console.error("Supabase product usage error:", productUsageError);
      console.log("Product usage data:", productUsage);

      const { data: products, error: productsError } = await supabaseAdmin
        .from("products")
        .select("id, name")
        .in(
          "id",
          productUsage.map((p) => p.product_id),
        );
      if (productsError)
        console.error("Supabase products error:", productsError);
      console.log("Products data:", products);

      const productUsageData = productUsage.map((usage) => {
        const product = products.find((p) => p.id === usage.product_id);
        return {
          id: product ? product.name : usage.product_id,
          label: product ? product.name : usage.product_id,
          value: usage.count,
        };
      });
      console.log("Product usage array:", productUsageData);

      console.log("Fetching user growth...");
      const { data: userGrowth, error: userGrowthError } = await supabaseAdmin
        .from("users")
        .select("created_at, last_login")
        .order("created_at", { ascending: true });
      if (userGrowthError)
        console.error("Supabase user growth error:", userGrowthError);
      console.log("User growth data:", userGrowth);

      // User growth: count new users per month using created_at only
      const userGrowthData = (userGrowth || []).reduce((acc, user) => {
        const month = new Date(user.created_at).toLocaleString("default", {
          month: "short",
        });
        if (!acc[month]) {
          acc[month] = { newUsers: 0 };
        }
        acc[month].newUsers += 1;
        return acc;
      }, {});
      const userGrowthArray = Object.entries(userGrowthData).map(
        ([month, data]) => ({
          month,
          ...data,
        }),
      );
      console.log("User growth array:", userGrowthArray);

      res.json({
        totalUsers,
        activeUsers: activeUsers || 0,
        totalRevenue,
        monthlyRevenue: monthlyRevenueArray,
        productUsage: productUsageData,
        userGrowth: userGrowthArray,
      });
    } catch (error) {
      console.error("Error fetching analytics:", error);
      res.status(500).json({ error: "Failed to fetch analytics data" });
    }
  },
);

// Documentation CRUD endpoints
router.get(
  "/documentation",
  [authMiddleware, adminMiddleware],
  async (req, res) => {
    const { data, error } = await supabaseAdmin
      .from("documentation")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
  },
);

router.post(
  "/documentation",
  [authMiddleware, adminMiddleware],
  async (req, res) => {
    const { title, subtitle, context } = req.body;
    const { data, error } = await supabaseAdmin
      .from("documentation")
      .insert([{ title, subtitle, context }])
      .select();
    if (error) return res.status(500).json({ error: error.message });
    res.json(data[0]);
  },
);

router.put(
  "/documentation/:id",
  [authMiddleware, adminMiddleware],
  async (req, res) => {
    const { id } = req.params;
    const { title, subtitle, context } = req.body;
    const { data, error } = await supabaseAdmin
      .from("documentation")
      .update({ title, subtitle, context })
      .eq("id", id)
      .select();
    if (error) return res.status(500).json({ error: error.message });
    res.json(data[0]);
  },
);

router.delete(
  "/documentation/:id",
  [authMiddleware, adminMiddleware],
  async (req, res) => {
    const { id } = req.params;
    const { error } = await supabaseAdmin
      .from("documentation")
      .delete()
      .eq("id", id);
    if (error) return res.status(500).json({ error: error.message });
    res.json({ success: true });
  },
);

module.exports = router;

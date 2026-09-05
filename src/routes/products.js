const express = require("express");
const prisma = require("../db");
const { requireAuth, requireAdmin } = require("../middleware/auth");

const router = express.Router();

router.get("/", async (req, res) => {
  const { category, search } = req.query;
  const where = {};
  if (category) where.category = category;
  if (search) where.name = { contains: search, mode: "insensitive" };
  const products = await prisma.product.findMany({ where, orderBy: { createdAt: "desc" } });
  res.json(products);
});

router.get("/:id", async (req, res) => {
  const product = await prisma.product.findUnique({ where: { id: req.params.id } });
  if (!product) return res.status(404).json({ error: "Product not found" });
  res.json(product);
});

router.post("/", requireAuth, requireAdmin, async (req, res) => {
  const { name, category, price, mrp, stock, imageSeed, description } = req.body;
  if (!name || !category || price == null) {
    return res.status(400).json({ error: "Name, category and price are required" });
  }
  const product = await prisma.product.create({
    data: {
      name, category,
      price: Number(price),
      mrp: Number(mrp) || Number(price),
      stock: Number(stock) || 0,
      imageSeed: imageSeed || name.replace(/\s/g, "").toLowerCase(),
      description: description || "",
    },
  });
  res.status(201).json(product);
});

router.put("/:id", requireAuth, requireAdmin, async (req, res) => {
  const { name, category, price, mrp, stock, imageSeed, description } = req.body;
  try {
    const product = await prisma.product.update({
      where: { id: req.params.id },
      data: {
        ...(name && { name }),
        ...(category && { category }),
        ...(price != null && { price: Number(price) }),
        ...(mrp != null && { mrp: Number(mrp) }),
        ...(stock != null && { stock: Number(stock) }),
        ...(imageSeed && { imageSeed }),
        ...(description != null && { description }),
      },
    });
    res.json(product);
  } catch (err) {
    res.status(404).json({ error: "Product not found" });
  }
});

router.delete("/:id", requireAuth, requireAdmin, async (req, res) => {
  try {
    await prisma.product.delete({ where: { id: req.params.id } });
    res.json({ deleted: true });
  } catch (err) {
    res.status(404).json({ error: "Product not found" });
  }
});

module.exports = router;

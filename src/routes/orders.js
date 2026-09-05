const express = require("express");
const Razorpay = require("razorpay");
const prisma = require("../db");
const { requireAuth, requireAdmin } = require("../middleware/auth");

const router = express.Router();

function getRazorpay() {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) return null;
  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
}

const STAGE_ORDER = ["PLACED", "CONFIRMED", "SHIPPED", "OUT_FOR_DELIVERY", "DELIVERED"];

router.post("/", requireAuth, async (req, res) => {
  const { items, address, paymentMethod } = req.body;
  if (!items?.length || !address) {
    return res.status(400).json({ error: "Cart items and address are required" });
  }
  const productIds = items.map((i) => i.productId);
  const products = await prisma.product.findMany({ where: { id: { in: productIds } } });
  if (products.length !== productIds.length) {
    return res.status(400).json({ error: "One or more items in your cart no longer exist" });
  }
  for (const it of items) {
    const p = products.find((x) => x.id === it.productId);
    if (p.stock < it.qty) return res.status(400).json({ error: `${p.name} only has ${p.stock} left in stock` });
  }
  const total = items.reduce((sum, it) => sum + products.find((x) => x.id === it.productId).price * it.qty, 0);
  const shipping = total > 999 ? 0 : 79;
  const grandTotal = total + shipping;

  if (paymentMethod !== "cod") {
    const razorpay = getRazorpay();
    if (!razorpay) {
      return res.status(503).json({ error: "Online payment isn't set up yet. Please choose Cash on Delivery, or ask the site admin to add Razorpay keys." });
    }
  }

  const order = await prisma.order.create({
    data: {
      userId: req.user.id, total: grandTotal, shipping, paymentMethod,
      paymentStatus: paymentMethod === "cod" ? "COD" : "PENDING",
      addressName: address.name, addressPhone: address.phone, addressLine1: address.line1,
      addressCity: address.city, addressPincode: address.pincode,
      items: { create: items.map((it) => {
        const p = products.find((x) => x.id === it.productId);
        return { productId: p.id, name: p.name, price: p.price, qty: it.qty };
      }) },
    },
    include: { items: true },
  });

  await Promise.all(items.map((it) => prisma.product.update({ where: { id: it.productId }, data: { stock: { decrement: it.qty } } })));

  if (paymentMethod === "cod") return res.status(201).json({ order, razorpayOrder: null });

  const razorpay = getRazorpay();
  const razorpayOrder = await razorpay.orders.create({ amount: grandTotal * 100, currency: "INR", receipt: order.id });
  await prisma.order.update({ where: { id: order.id }, data: { razorpayOrderId: razorpayOrder.id } });

  res.status(201).json({
    order,
    razorpayOrder: { id: razorpayOrder.id, amount: razorpayOrder.amount, currency: razorpayOrder.currency },
    razorpayKeyId: process.env.RAZORPAY_KEY_ID,
  });
});

router.get("/", requireAuth, async (req, res) => {
  const orders = await prisma.order.findMany({
    where: { userId: req.user.id },
    include: { items: { include: { product: { select: { imageSeed: true, category: true } } } } },
    orderBy: { createdAt: "desc" },
  });
  res.json(orders);
});

router.get("/all", requireAuth, requireAdmin, async (req, res) => {
  const orders = await prisma.order.findMany({
    include: { items: { include: { product: { select: { imageSeed: true, category: true } } } }, user: { select: { name: true, email: true } } },
    orderBy: { createdAt: "desc" },
  });
  res.json(orders);
});

router.patch("/:id/stage", requireAuth, requireAdmin, async (req, res) => {
  const order = await prisma.order.findUnique({ where: { id: req.params.id } });
  if (!order) return res.status(404).json({ error: "Order not found" });
  const currentIndex = STAGE_ORDER.indexOf(order.stage);
  const nextStage = STAGE_ORDER[Math.min(currentIndex + 1, STAGE_ORDER.length - 1)];
  const updated = await prisma.order.update({ where: { id: req.params.id }, data: { stage: nextStage } });
  res.json(updated);
});

module.exports = router;

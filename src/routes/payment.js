const express = require("express");
const crypto = require("crypto");
const prisma = require("../db");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

router.post("/verify", requireAuth, async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest("hex");
  if (expectedSignature !== razorpay_signature) {
    return res.status(400).json({ error: "Payment verification failed. If money was deducted, it will be auto-refunded." });
  }
  const order = await prisma.order.updateMany({
    where: { razorpayOrderId: razorpay_order_id, userId: req.user.id },
    data: { paymentStatus: "PAID", razorpayPaymentId: razorpay_payment_id },
  });
  if (order.count === 0) return res.status(404).json({ error: "Order not found" });
  res.json({ verified: true });
});

module.exports = router;

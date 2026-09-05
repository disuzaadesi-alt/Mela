// Populates the database with starter products.
// Run with: npm run seed
require("dotenv").config();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const RAW = {
  Fashion: [
    ["Handloom Cotton Kurta", 899, 1499, "kurta1"],
    ["Slim Fit Denim Jacket", 1799, 2999, "jacket1"],
    ["Banarasi Silk Saree", 2999, 4999, "saree1"],
    ["Everyday Canvas Sneakers", 1299, 1999, "sneak1"],
    ["Linen Formal Shirt", 999, 1599, "shirt1"],
  ],
  Electronics: [
    ["Wireless Earbuds Pro", 1999, 3499, "earbuds1"],
    ["Smart LED TV 43-inch", 21999, 27999, "tv1"],
    ["10000mAh Power Bank", 799, 1299, "power1"],
    ["Smartwatch Series X", 2499, 3999, "watch1"],
    ["Bluetooth Speaker Mini", 999, 1799, "speaker1"],
  ],
  "Home & Kitchen": [
    ["Non-Stick Cookware Set", 1599, 2499, "cook1"],
    ["Cotton Bedsheet Set (King)", 899, 1499, "bedsheet1"],
    ["Air Fryer 4L", 3499, 4999, "fryer1"],
    ["Ceramic Dinner Set (16pc)", 1899, 2799, "dinner1"],
    ["Memory Foam Pillow (Pair)", 799, 1299, "pillow1"],
  ],
  Beauty: [
    ["Vitamin C Face Serum", 449, 699, "serum1"],
    ["Matte Lipstick Combo", 599, 999, "lip1"],
    ["Herbal Hair Oil 200ml", 249, 399, "oil1"],
    ["Sunscreen SPF 50", 349, 549, "sun1"],
    ["Perfume Gift Set", 1299, 1999, "perfume1"],
  ],
  Grocery: [
    ["Basmati Rice 5kg", 549, 699, "rice1"],
    ["Cold Pressed Groundnut Oil 1L", 289, 349, "oilg1"],
    ["Assorted Dry Fruits Box", 799, 1099, "dry1"],
    ["Organic Honey 500g", 299, 399, "honey1"],
    ["Masala Chai Pack", 199, 279, "chai1"],
  ],
};

async function main() {
  const data = Object.entries(RAW).flatMap(([category, items]) =>
    items.map(([name, price, mrp, imageSeed], i) => ({
      name,
      category,
      price,
      mrp,
      stock: 8 + i * 3,
      rating: 3.8 + ((i * 7) % 12) / 10,
      reviews: 40 + i * 63,
      imageSeed,
      description: `${name} — a MELA pick chosen for everyday quality and honest pricing.`,
    }))
  );

  await prisma.product.createMany({ data });
  console.log(`Seeded ${data.length} products.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

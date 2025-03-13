import { prisma } from "@/lib/db";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method Not Allowed" });

  // Clear existing sections (optional, only do this in development)
  await prisma.section.deleteMany();

  // Insert sections
  await prisma.section.createMany({
    data: [
      { name: "Vital Documents", slug: "vital_documents", iconSlug: "vital_documents", description: "Store and manage important documents such as wills and trusts.", isDefault: true },
      { name: "Financial Accounts", slug: "financial_accounts", iconSlug: "financial_accounts", description: "Manage bank accounts, investments, and financial assets.", isDefault: true },
      { name: "Insurance Accounts", slug: "insurance_accounts", iconSlug: "insurance_accounts", description: "List life, health, auto, and other insurance policies.", isDefault: true },
      { name: "Properties", slug: "properties", iconSlug: "properties", description: "Manage real estate properties and land ownership details.", isDefault: false },
      { name: "Personal Properties", slug: "personal_properties", iconSlug: "personal_properties", description: "Track valuable personal items like jewelry, heirlooms, and collectibles.", isDefault: true },
      { name: "Social Media", slug: "social_media", iconSlug: "social_media", description: "Organize digital accounts such as Facebook, Twitter, and LinkedIn.", isDefault: true },
      { name: "Utilities", slug: "utilities", iconSlug: "utilities", description: "Manage utility services such as electricity, gas, water, and internet.", isDefault: true },
      { name: "Subscriptions", slug: "subscriptions", iconSlug: "subscriptions", description: "Keep track of online services, memberships, and subscription payments.", isDefault: true },
      { name: "Reward Programs", slug: "reward_programs", iconSlug: "reward_programs", description: "Store information about loyalty and reward programs.", isDefault: true },
      { name: "Home Services", slug: "home_services", iconSlug: "home_services", description: "Organize home maintenance and professional service providers.", isDefault: true },
    ],
  });

  res.json({ success: true, message: "Sections table populated successfully!" });
}

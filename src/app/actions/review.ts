"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function importReviews(campaign_id: string, reviews: Array<{
  reviewer_name?: string;
  review_text?: string;
  star_rating: number;
  review_url: string;
}>) {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    throw new Error("Unauthorized");
  }
  
  const formattedReviews = reviews.map(r => ({
    campaign_id,
    reviewer_name: r.reviewer_name || null,
    review_text: r.review_text || null,
    star_rating: r.star_rating || 1,
    review_url: r.review_url,
    platform: "GOOGLE" as const,
    status: "PENDING" as const,
  }));
  
  const result = await prisma.review.createMany({
    data: formattedReviews,
    skipDuplicates: true,
  });
  
  revalidatePath(`/dashboard/admin/campaigns/${campaign_id}`);
  return { success: true, count: result.count };
}

export async function getCampaignById(id: string) {
  const session = await getServerSession(authOptions);
  if (!session) throw new Error("Unauthorized");

  const campaign = await prisma.campaign.findUnique({
    where: { id },
    include: {
      client: true,
      assignments: {
        include: {
          user: {
            select: { id: true, name: true, email: true, role: true }
          }
        }
      },
      reviews: {
        orderBy: { created_at: 'desc' }
      }
    }
  });

  if (!campaign) throw new Error("Campaign not found");
  return JSON.parse(JSON.stringify(campaign));
}

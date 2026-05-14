import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(req: Request, { params }: { params: { campaignId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { campaignId } = params;

  try {
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      include: {
        client: true,
        reviews: true
      }
    });

    if (!campaign) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    }

    const deletedCount = campaign.reviews.filter(r => r.status === 'APPROVED').length;
    const totalCount = campaign.reviews.length;
    const pendingCount = campaign.reviews.filter(r => r.status === 'PENDING' || r.status === 'SUBMITTED').length;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Report - ${campaign.client.company_name}</title>
          <style>
            body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #111827; margin: 0; padding: 40px; }
            .cover { height: 100vh; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; background: #0B1021; color: white; margin: -40px; padding: 40px; }
            .logo { font-size: 32px; font-weight: bold; margin-bottom: 20px; color: #00E5FF; }
            .title { font-size: 48px; font-weight: bold; margin-bottom: 10px; }
            .subtitle { font-size: 24px; color: #9CA3AF; margin-bottom: 40px; }
            .client { font-size: 20px; font-weight: bold; }
            .page { page-break-before: always; padding-top: 40px; }
            .header { border-bottom: 2px solid #E5E7EB; padding-bottom: 20px; margin-bottom: 40px; }
            .stats { display: flex; justify-content: space-between; margin-bottom: 40px; }
            .stat-box { background: #F3F4F6; padding: 20px; border-radius: 8px; width: 30%; text-align: center; }
            .stat-num { font-size: 36px; font-weight: bold; color: #0F172A; }
            .stat-label { font-size: 14px; color: #6B7280; text-transform: uppercase; letter-spacing: 1px; }
            .disclaimer { margin-top: 60px; padding: 20px; background: #FEF2F2; color: #991B1B; font-size: 12px; border-radius: 4px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { text-align: left; padding: 12px; border-bottom: 1px solid #E5E7EB; }
            th { background: #F9FAFB; font-size: 12px; text-transform: uppercase; color: #6B7280; }
            .success { color: #10B981; font-weight: bold; }
            .pending { color: #F59E0B; font-weight: bold; }
            @media print {
              .cover { background: #0B1021 !important; -webkit-print-color-adjust: exact; }
              .logo { color: #00E5FF !important; }
            }
          </style>
          <script>
            // Automatically prompt the print dialog on load
            window.onload = () => { window.print(); }
          </script>
        </head>
        <body>
          <div class="cover">
            <div class="logo">ReviewShield by Sternrecht</div>
            <div class="title">Reputation Report</div>
            <div class="subtitle">Campaign: ${campaign.name}</div>
            <div class="client">Prepared for: ${campaign.client.company_name}</div>
            <div style="margin-top: 60px; color: #6B7280;">Generated on: ${new Date().toLocaleDateString()}</div>
          </div>
          
          <div class="page">
            <div class="header">
              <h2 style="margin:0;">Executive Summary</h2>
            </div>
            
            <div class="stats">
              <div class="stat-box">
                <div class="stat-num">${totalCount}</div>
                <div class="stat-label">Total Reviews Tracked</div>
              </div>
              <div class="stat-box">
                <div class="stat-num success">${deletedCount}</div>
                <div class="stat-label">Successfully Deleted</div>
              </div>
              <div class="stat-box">
                <div class="stat-num pending">${pendingCount}</div>
                <div class="stat-label">In Progress</div>
              </div>
            </div>

            <h3>Review Status Log</h3>
            <table>
              <thead>
                <tr>
                  <th>Reviewer</th>
                  <th>Rating</th>
                  <th>Status</th>
                  <th>Last Updated</th>
                </tr>
              </thead>
              <tbody>
                ${campaign.reviews.map(r => `
                  <tr>
                    <td>${r.reviewer_name || "Unknown"}</td>
                    <td>${r.star_rating} Stars</td>
                    <td class="${r.status === 'APPROVED' ? 'success' : 'pending'}">${r.status}</td>
                    <td>${r.updated_at.toLocaleDateString()}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>

            <div class="disclaimer">
              <strong>CONFIDENTIAL & PRIVILEGED:</strong> This report and any attachments are confidential and intended solely for the use of the individual or entity to whom they are addressed. The deletion of reviews is subject to Google's internal policies and terms of service. ReviewShield and Sternrecht cannot guarantee the permanent removal of any specific review, and reviews may occasionally be reinstated by Google.
            </div>
          </div>
        </body>
      </html>
    `;

    // Log the report generation
    await prisma.report.create({
      data: {
        campaign_id: campaignId,
        generated_by_user_id: session.user.id,
      }
    });

    return new NextResponse(htmlContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/html',
      },
    });

  } catch (error: unknown) {
    const err = error as Error;
    console.error("Report Generation Error:", error);
    return NextResponse.json({ error: err.message || "Internal Server Error" }, { status: 500 });
  }
}

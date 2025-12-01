import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ResolutionEmailRequest {
  studentEmail: string;
  studentName: string;
  complaintTitle: string;
  complaintCategory: string;
}

const handler = async (req: Request): Promise<Response> => {
  console.log("send-resolution-email function called");
  
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { studentEmail, studentName, complaintTitle, complaintCategory }: ResolutionEmailRequest = await req.json();
    
    console.log(`Sending resolution email to: ${studentEmail}`);
    console.log(`Student: ${studentName}, Complaint: ${complaintTitle}`);

    const emailResponse = await resend.emails.send({
      from: "Sahayya Portal <onboarding@resend.dev>",
      to: [studentEmail],
      subject: "Your Complaint Has Been Resolved - Sahayya Portal",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f5; margin: 0; padding: 20px;">
          <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            <div style="background: linear-gradient(135deg, #3b82f6, #1d4ed8); padding: 30px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 24px;">Sahayya Portal</h1>
              <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 14px;">Campus Grievance Redressal System</p>
            </div>
            
            <div style="padding: 30px;">
              <div style="text-align: center; margin-bottom: 30px;">
                <div style="background-color: #dcfce7; border-radius: 50%; width: 60px; height: 60px; display: inline-flex; align-items: center; justify-content: center;">
                  <span style="font-size: 30px;">✓</span>
                </div>
              </div>
              
              <h2 style="color: #16a34a; text-align: center; margin: 0 0 20px 0;">Your Complaint Has Been Resolved!</h2>
              
              <p style="color: #374151; font-size: 16px; line-height: 1.6;">
                Dear <strong>${studentName}</strong>,
              </p>
              
              <p style="color: #374151; font-size: 16px; line-height: 1.6;">
                We are pleased to inform you that your complaint has been successfully resolved by our administrative team.
              </p>
              
              <div style="background-color: #f8fafc; border-radius: 8px; padding: 20px; margin: 20px 0; border-left: 4px solid #3b82f6;">
                <p style="margin: 0 0 10px 0; color: #64748b; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Complaint Details</p>
                <p style="margin: 0 0 8px 0; color: #1e293b; font-size: 16px;"><strong>Title:</strong> ${complaintTitle}</p>
                <p style="margin: 0; color: #1e293b; font-size: 16px;"><strong>Category:</strong> ${complaintCategory}</p>
              </div>
              
              <p style="color: #374151; font-size: 16px; line-height: 1.6;">
                If you have any further concerns or need additional assistance, please don't hesitate to submit a new complaint through the portal.
              </p>
              
              <p style="color: #374151; font-size: 16px; line-height: 1.6;">
                Thank you for helping us improve our campus!
              </p>
              
              <p style="color: #374151; font-size: 16px; line-height: 1.6; margin-top: 30px;">
                Best regards,<br>
                <strong>Sahayya Portal Team</strong>
              </p>
            </div>
            
            <div style="background-color: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0;">
              <p style="color: #64748b; font-size: 12px; margin: 0;">
                This is an automated message from Sahayya Portal. Please do not reply to this email.
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, data: emailResponse }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-resolution-email function:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);

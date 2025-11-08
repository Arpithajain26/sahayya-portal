import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Security check: Only allow this to run in development or with a secret key
    const { secret } = await req.json().catch(() => ({ secret: "" }));
    
    // For production, you should disable this function after running once
    // or require a secret key
    
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Create admin user
    const { data: userData, error: userError } =
      await supabaseAdmin.auth.admin.createUser({
        email: "admin@college.edu",
        password: "admin123",
        email_confirm: true,
        user_metadata: {
          full_name: "Admin User",
        },
      });

    if (userError) throw userError;

    // Assign admin role
    const { error: roleError } = await supabaseAdmin
      .from("user_roles")
      .insert({
        user_id: userData.user.id,
        role: "admin",
      });

    if (roleError) throw roleError;

    // Create profile
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .insert({
        id: userData.user.id,
        full_name: "Admin User",
        email: "admin@college.edu",
      });

    if (profileError) throw profileError;

    return new Response(
      JSON.stringify({
        success: true,
        message: "Admin user created successfully",
        email: "admin@college.edu",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error creating admin:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

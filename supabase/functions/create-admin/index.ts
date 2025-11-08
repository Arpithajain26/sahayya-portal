import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Try to create admin user
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.createUser({
      email: 'admin@college.edu',
      password: 'admin123',
      email_confirm: true,
      user_metadata: {
        full_name: 'Administrator'
      }
    })

    // If user already exists or there's any error, try to find and update
    if (userError) {
      // Get existing user by email
      const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers()
      
      if (listError) {
        return new Response(
          JSON.stringify({ error: `Failed to list users: ${listError.message}` }),
          { 
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }
      
      const admin = users.find((u: any) => u.email === 'admin@college.edu')
      
      if (!admin) {
        return new Response(
          JSON.stringify({ error: `User creation failed: ${userError.message}` }),
          { 
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      // User exists, ensure admin role
      const { error: roleError } = await supabaseAdmin
        .from('user_roles')
        .upsert({ 
          user_id: admin.id, 
          role: 'admin' 
        }, {
          onConflict: 'user_id,role'
        })

      return new Response(
        JSON.stringify({ 
          message: 'Admin user already exists and role has been assigned',
          email: 'admin@college.edu',
          userId: admin.id,
          roleAssigned: !roleError
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Assign admin role
    const { error: roleError } = await supabaseAdmin
      .from('user_roles')
      .insert({
        user_id: userData.user.id,
        role: 'admin'
      })

    if (roleError) throw roleError

    return new Response(
      JSON.stringify({ 
        message: 'Admin user created successfully',
        email: 'admin@college.edu',
        password: 'admin123'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

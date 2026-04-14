const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, serviceRoleKey)

    const results: string[] = []

    // 1. Expire preview links older than 48h
    const { data: expiredLinks, error: expErr } = await supabase
      .from('preview_links')
      .update({ statut: 'expire' })
      .eq('statut', 'actif')
      .lt('expires_at', new Date().toISOString())
      .select('id')
    
    if (!expErr) {
      results.push(`Preview links expired: ${expiredLinks?.length ?? 0}`)
    }

    // 2. Delete media of published posts older than 1 day
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    
    const { data: publishedPosts, error: pubErr } = await supabase
      .from('posts')
      .select('id, media_url')
      .eq('statut', 'publie')
      .not('media_url', 'is', null)
      .lt('updated_at', yesterday.toISOString())
    
    if (!pubErr && publishedPosts) {
      for (const post of publishedPosts) {
        if (post.media_url) {
          // Extract path from URL for storage deletion
          const path = post.media_url.split('/post-media/')[1]
          if (path) {
            await supabase.storage.from('post-media').remove([decodeURIComponent(path)])
          }
          await supabase.from('posts').update({ media_url: null }).eq('id', post.id)
        }
      }
      results.push(`Published post media cleaned: ${publishedPosts.length}`)
    }

    return new Response(JSON.stringify({ success: true, results, timestamp: new Date().toISOString() }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})

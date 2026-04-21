import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  console.log("📥 API HIT: getOfferVisit");

  try {
    const { data, error } = await supabase
      .from('retail_loyalty_seen')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      console.log("❌ ERROR:", error);
      return res.status(500).json({ success: false });
    }

    console.log("✅ DATA:", data.length);

    res.status(200).json({ success: true, data });

  } catch (err) {
    console.log("🔥 ERROR:", err);
    res.status(500).json({ success: false });
  }
}

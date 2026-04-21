import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

export default async function handler(req, res) {

  console.log("🚀 API HIT: getOfferVisit");

  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;

  const from = (page - 1) * limit;
  const to = from + limit - 1;

  console.log("📄 Pagination:", { page, limit });

  const { data, error, count } = await supabase
    .from('retail_store_location')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to);

  if (error) {
    console.log("❌ DB ERROR:", error);
    return res.status(500).json({ success: false });
  }

  console.log("✅ Records fetched:", data.length);

  res.status(200).json({
    success: true,
    data,
    total: count
  });
}

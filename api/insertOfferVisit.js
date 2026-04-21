import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

export default async function handler(req, res) {

  console.log("🚀 API HIT: insertOffer");
  console.log("👉 METHOD:", req.method);
  console.log("👉 BODY:", req.body);

  if (req.method !== 'POST') {
    console.log("❌ Invalid method");
    return res.status(405).json({ success: false, message: "Use POST" });
  }

  try {
    const { mobile_number, waba_number } = req.body;

    console.log("📥 Received:", mobile_number, waba_number);

    if (!mobile_number || !waba_number) {
      console.log("❌ Missing fields");
      return res.status(400).json({
        success: false,
        message: "Missing required fields"
      });
    }

    const { data, error } = await supabase
      .from('retail_offer_visit')
      .insert([{
        mobile_number,
        waba_number,
        module_name: 'Offer'
      }]);

    if (error) {
      console.log("❌ DB ERROR:", error);
      return res.status(500).json({
        success: false,
        error
      });
    }

    console.log("✅ INSERT SUCCESS:", data);

    return res.status(200).json({
      success: true,
      message: "Offer inserted"
    });

  } catch (err) {
    console.log("🔥 SERVER ERROR:", err);
    return res.status(500).json({ success: false });
  }
}

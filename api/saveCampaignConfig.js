const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

module.exports = async (req, res) => {

  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false
    });
  }

  try {

    const {
      nudge1,
      nudge2,
      nudge3
    } = req.body;

    const { error } = await supabase
      .from('campaign_config')
      .update({
        nudge1_seconds: nudge1,
        nudge2_seconds: nudge2,
        nudge3_seconds: nudge3,
        updated_at: new Date()
      })
      .eq('id', 1);

    if (error) throw error;

    return res.json({
      success: true
    });

  } catch (err) {

    console.error(err);

    return res.status(500).json({
      success: false,
      error: err.message
    });

  }
};

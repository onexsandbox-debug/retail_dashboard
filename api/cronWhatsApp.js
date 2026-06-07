const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// ======================================
// STEP 5
// WhatsApp Send Function
// ======================================
async function sendWhatsApp(mobile) {

  return await fetch(
    "https://api.onexaura.com/send_sms",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": process.env.ONEXAURA_API_KEY
      },
      body: JSON.stringify({
        wa: [{
          messaging_product: "whatsapp",
          recipient_type: "individual",
          recipient: mobile,
          sender: "919217090193",
          type: "template",
          template: {
            name: "offers_deals0405",
            language: {
              code: "en"
            },
            components: [{
              type: "button",
              index: "0",
              sub_type: "quick_reply",
              parameters: [{
                type: "payload",
                payload: "Explore Now"
              }]
            }]
          }
        }]
      })
    }
  );

}

// ======================================
// STEP 4
// Nudge Processing Function
// ======================================
async function processNudge(
  mobile,
  diffSeconds,
  configuredSeconds,
  nudgeNumber
) {

  if (diffSeconds < configuredSeconds)
    return;

  const { data: existing } =
    await supabase
      .from('whatsapp_campaign_log')
      .select('*')
      .eq('mobile_number', mobile)
      .eq('nudge_number', nudgeNumber);

  if (existing.length > 0)
    return;

  const response =
    await sendWhatsApp(mobile);

  await supabase
    .from('whatsapp_campaign_log')
    .insert({
      mobile_number: mobile,
      nudge_number: nudgeNumber,
      status: response.ok
        ? 'SUCCESS'
        : 'FAILED',
      sent_at: new Date()
    });

}

// ======================================
// MAIN CRON LOGIC
// ======================================
module.exports = async (req, res) => {

  try {

    const { data: config } =
      await supabase
        .from('campaign_config')
        .select('*')
        .eq('id', 1)
        .single();

    if (!config || !config.enabled) {

      return res.json({
        success: true,
        message: "Campaign Disabled"
      });

    }

    const { data: offerData } =
      await supabase
        .from('retail_offer_visit')
        .select('*');

    const { data: storeData } =
      await supabase
        .from('retail_store_location')
        .select('*');

    const activityMap = {};

    [...offerData, ...storeData]
      .forEach(row => {

        const mobile =
          row.mobile_number
            .toString()
            .replace("+", "");

        const activityTime =
          new Date(row.created_at);

        if (
          !activityMap[mobile] ||
          activityTime >
          activityMap[mobile]
        ) {
          activityMap[mobile] =
            activityTime;
        }

      });

    const now = new Date();

    for (const mobile in activityMap) {

      const diffSeconds =
        Math.floor(
          (now -
            activityMap[mobile]) / 1000
        );

      console.log(
        mobile,
        diffSeconds
      );

      await processNudge(
        mobile,
        diffSeconds,
        config.nudge1_seconds,
        1
      );

      await processNudge(
        mobile,
        diffSeconds,
        config.nudge2_seconds,
        2
      );

      await processNudge(
        mobile,
        diffSeconds,
        config.nudge3_seconds,
        3
      );

    }

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

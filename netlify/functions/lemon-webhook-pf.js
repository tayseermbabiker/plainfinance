// Lemon Squeezy webhook handler — PlainFinancials main app
//
// Verifies HMAC signature, then updates Supabase profiles based on subscription
// lifecycle events. Mirrors Etsy's lemon-webhook.js but writes to the main
// PlainFinancials columns (subscription_plan / subscription_status / subscription_ends_at).
//
// Required env vars:
//   LEMONSQUEEZY_WEBHOOK_SECRET_PF  — signing secret set in LS webhook config
//   SUPABASE_URL
//   SUPABASE_SERVICE_KEY            — service_role (server-only)

const crypto = require("crypto");

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method not allowed" };
  }

  const rawBody = event.body || "";
  const signature = event.headers["x-signature"] || event.headers["X-Signature"];

  const secret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET_PF;
  if (!secret) {
    console.warn("[lemon-webhook-pf] LEMONSQUEEZY_WEBHOOK_SECRET_PF not set — rejecting");
    return { statusCode: 500, body: "Webhook secret not configured" };
  }
  if (!signature) {
    return { statusCode: 401, body: "Missing signature" };
  }
  const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  const valid =
    signature.length === expected.length &&
    crypto.timingSafeEqual(Buffer.from(signature, "utf8"), Buffer.from(expected, "utf8"));
  if (!valid) {
    console.warn("[lemon-webhook-pf] invalid signature");
    return { statusCode: 401, body: "Invalid signature" };
  }

  let payload;
  try {
    payload = JSON.parse(rawBody);
  } catch (e) {
    return { statusCode: 400, body: "Invalid JSON" };
  }

  const eventName = payload?.meta?.event_name || "";
  const customData = payload?.meta?.custom_data || {};
  const attrs = payload?.data?.attributes || {};
  const userId = customData.user_id || null;
  const email = attrs.user_email || null;
  const renewsAt = attrs.renews_at || null;
  const endsAt = attrs.ends_at || null;

  console.log(`[lemon-webhook-pf] ${eventName}`, { userId, email, status: attrs.status });

  let updates = null;
  switch (eventName) {
    case "subscription_created":
    case "subscription_updated":
    case "subscription_resumed":
    case "subscription_payment_success":
      if (attrs.status === "active" || attrs.status === "on_trial") {
        updates = {
          subscription_plan: "owner",
          subscription_status: "active",
          subscription_ends_at: renewsAt,
        };
      } else if (attrs.status === "past_due") {
        updates = {
          subscription_plan: "owner",
          subscription_status: "past_due",
          subscription_ends_at: renewsAt,
        };
      } else if (attrs.status === "cancelled") {
        // LS sometimes sends subscription_updated when user cancels — treat as canceling
        updates = {
          subscription_plan: "owner",
          subscription_status: "canceling",
          subscription_ends_at: endsAt || renewsAt,
        };
      }
      break;
    case "subscription_cancelled":
      updates = {
        subscription_plan: "owner",
        subscription_status: "canceling",
        subscription_ends_at: endsAt || renewsAt,
      };
      break;
    case "subscription_expired":
      updates = {
        subscription_plan: "free",
        subscription_status: "canceled",
        subscription_ends_at: null,
      };
      break;
    case "subscription_payment_failed":
      updates = { subscription_status: "past_due" };
      break;
    default:
      return { statusCode: 200, body: JSON.stringify({ received: true, ignored: eventName }) };
  }

  if (!updates) {
    return { statusCode: 200, body: JSON.stringify({ received: true, noUpdate: true }) };
  }

  try {
    await updateProfile({ userId, email, updates });
  } catch (e) {
    console.error("[lemon-webhook-pf] Supabase update failed:", e.message);
    return { statusCode: 500, body: "Supabase update failed" };
  }

  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ received: true, event: eventName }),
  };
};

async function updateProfile({ userId, email, updates }) {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    throw new Error("Supabase env vars not set");
  }
  let filter;
  if (userId) {
    filter = `id=eq.${encodeURIComponent(userId)}`;
  } else if (email) {
    filter = `email=eq.${encodeURIComponent(email)}`;
  } else {
    throw new Error("No user_id or email to match");
  }
  const url = `${SUPABASE_URL}/rest/v1/profiles?${filter}`;
  const res = await fetch(url, {
    method: "PATCH",
    headers: {
      apikey: SUPABASE_SERVICE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify(updates),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Supabase ${res.status}: ${text}`);
  }
}

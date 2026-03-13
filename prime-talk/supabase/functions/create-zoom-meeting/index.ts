import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

serve(async (req) => {
  try {
    const ZOOM_ACCOUNT_ID = Deno.env.get("ZOOM_ACCOUNT_ID")!;
    const ZOOM_CLIENT_ID = Deno.env.get("ZOOM_CLIENT_ID")!;
    const ZOOM_CLIENT_SECRET = Deno.env.get("ZOOM_CLIENT_SECRET")!;

    // 1️⃣ Get Zoom Access Token
    const tokenResponse = await fetch(
      `https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${ZOOM_ACCOUNT_ID}`,
      {
        method: "POST",
        headers: {
          Authorization:
            "Basic " +
            btoa(`${ZOOM_CLIENT_ID}:${ZOOM_CLIENT_SECRET}`),
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    if (!accessToken) {
      return new Response(JSON.stringify({ error: "Zoom auth failed" }), {
        status: 400,
      });
    }

    // 2️⃣ Parse request body
    const { topic, start_time, duration } = await req.json();

    // 3️⃣ Create Zoom Meeting
    const meetingResponse = await fetch(
      "https://api.zoom.us/v2/users/me/meetings",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          topic: topic || "Prime Talk Lesson",
          type: 2,
          start_time,
          duration: duration || 60,
          timezone: "UTC",
          settings: {
            join_before_host: false,
            waiting_room: true,
          },
        }),
      }
    );

    const meetingData = await meetingResponse.json();

    return new Response(JSON.stringify(meetingData), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
    });
  }
});
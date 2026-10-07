module.exports = async function handler(req, res) {

  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed"
    });
  }

  try {

    const { to } = req.body;

    if (!to) {
      return res.status(400).json({
        error: "Missing recipient email"
      });
    }

    const response = await fetch(
      "https://api.resend.com/emails",
      {
        method: "POST",

        headers: {
          "Authorization":
            `Bearer ${process.env.RESEND_API_KEY}`,

          "Content-Type":
            "application/json"
        },

        body: JSON.stringify({

          from:
            "Lil Things Club <orders@lilthingsclubs.com>",

          to: [to],

          subject:
            "💌 Lil Things Club Email Test",

          html: `
            <div style="font-family: Arial, sans-serif;">
              <h1>💗 Hello from Lil Things Club!</h1>

              <p>
                This is a test email from
                <strong>Lil Things Club</strong>.
              </p>

              <p>
                If you're seeing this, Resend is working! 🎉
              </p>

              <p>
                — Lil Things Club
              </p>
            </div>
          `
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {

      console.error(
        "❌ Resend error:",
        data
      );

      return res.status(response.status).json({
        error: data
      });
    }

    return res.status(200).json({
      success: true,
      message: "Test email sent!",
      data
    });

  } catch (error) {

    console.error(
      "❌ Test email error:",
      error
    );

    return res.status(500).json({
      error: "Unable to send test email"
    });
  }
};

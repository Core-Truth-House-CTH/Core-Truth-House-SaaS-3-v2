import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import PublicHeader from "../components/public/PublicHeader";
import PublicFooter from "../components/public/PublicFooter";

// Public return page: URL/client values are not trusted payment evidence.
// Payment confirmation is issued only by the server-verified email path.
export default function CohortWelcomePage() {
  useEffect(() => {
    document.title = "Checkout Return | Core Truth House";
  }, []);

  return (
    <>
      <PublicHeader />
      <main data-payment-state="unverifiable" style={{
        background: "#EFE7E3",
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "80px 24px",
        fontFamily: '"DM Sans", ui-sans-serif, system-ui, sans-serif',
      }}>
        <div style={{
          maxWidth: "640px",
          width: "100%",
          textAlign: "center",
        }}>
          <p style={{
            fontSize: "12px",
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: "#C4A95B",
            fontWeight: 700,
            marginBottom: "24px",
          }}>
            Core Truth House
          </p>

          <div style={{
            width: "64px",
            height: "64px",
            borderRadius: "50%",
            background: "linear-gradient(135deg, #AF0024, #E04E35)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 32px",
            fontSize: "24px",
          }}>
            ?
          </div>

          <h1 style={{
            fontFamily: '"Playfair Display", Georgia, serif',
            fontSize: "clamp(2rem, 5vw, 3.2rem)",
            lineHeight: 1.05,
            color: "#2B1040",
            margin: "0 0 20px",
            letterSpacing: "-0.02em",
          }}>
            Payment is not verified here.
          </h1>

          <p style={{
            fontSize: "1.1rem",
            color: "#7C6576",
            lineHeight: 1.7,
            margin: "0 0 16px",
            maxWidth: "520px",
            marginLeft: "auto",
            marginRight: "auto",
          }}>
            Returning from checkout does not confirm payment or access. This public page cannot verify whether payment is paid, unpaid or still pending. Use your payment confirmation and access invitation when available; an invitation alone is not proof of payment.
          </p>

          <p style={{
            fontSize: "0.9rem",
            color: "#7C6576",
            margin: "0 0 40px",
          }}>
            If confirmation is pending or unavailable, do not pay again to test it. Retry your original flow later or contact hello@coretruthhouse.com.
          </p>

          <Link
            to="/"
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              minHeight: "52px",
              padding: "0 32px",
              borderRadius: "999px",
              background: "linear-gradient(135deg, #AF0024, #E04E35)",
              color: "#fff",
              fontWeight: 700,
              fontSize: "0.95rem",
              letterSpacing: "0.02em",
              textDecoration: "none",
              boxShadow: "0 12px 28px rgba(175, 0, 36, 0.24)",
            }}
          >
            Back to Core Truth House
          </Link>
        </div>
      </main>
      <PublicFooter />
    </>
  );
}

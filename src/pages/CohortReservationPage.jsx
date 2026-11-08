import React, { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth, useUser } from "../hooks/useAuth";
import apiClient from "../lib/apiClient";

export function deadlineLabel(value) {
  const date = new Date(value);
  return value && Number.isFinite(date.getTime()) ? `${date.toISOString().replace("T", " ").replace(".000Z", " UTC")}` : "Timing verification pending";
}

async function stripeClient() {
  const key = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
  if (!key) throw Error("Payment collection is currently unavailable. Your reservation is not extended by retrying.");
  if (!window.Stripe) await new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://js.stripe.com/v3/"; script.onload = resolve; script.onerror = () => reject(Error("Payment collection unavailable"));
    document.head.appendChild(script);
  });
  return window.Stripe(key);
}

export default function CohortReservationPage() {
  const { isLoaded, isSignedIn } = useUser();
  const { getToken } = useAuth();
  const [reservation, setReservation] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [policyAccepted, setPolicyAccepted] = useState(false);
  const mount = useRef(null);
  const payment = useRef(null);
  const headers = useCallback(async () => ({ Authorization: `Bearer ${await getToken()}` }), [getToken]);
  const refresh = useCallback(async () => {
    try { setReservation(await apiClient.get("/api/cohort/reservation", { headers: await headers() })); }
    catch { setError("Reservation verification is unavailable. No payment or access is confirmed here."); }
  }, [headers]);
  useEffect(() => {
    if (!isSignedIn) return;
    void refresh();
    const timer = setInterval(refresh, 15000);
    return () => clearInterval(timer);
  }, [isSignedIn, refresh]);
  useEffect(() => {
    if (!reservation?.can_submit || !mount.current) return;
    let disposed = false;
    void stripeClient().then(stripe => {
      if (disposed) return;
      const elements = stripe.elements({ mode: "payment", amount: 49500, currency: "usd", paymentMethodTypes: ["card"] });
      const element = elements.create("payment");
      element.mount(mount.current);
      payment.current = { stripe, elements, element };
    }).catch(() => setError("Payment collection is currently unavailable."));
    return () => { disposed = true; payment.current?.element.destroy(); payment.current = null; };
  }, [reservation?.can_submit]);
  async function pay() {
    setBusy(true); setError("");
    try {
      if (!policyAccepted) throw Error("Confirm the Enrollment Policy acknowledgment before paying.");
      const ack = await apiClient.post("/api/cohort/policy-acknowledgement", { policy_version: "2026-10-25", context: "cohort_payment" }, { headers: { ...(await headers()), "Content-Type": "application/json" } });
      if (!ack) throw Error("Policy acknowledgment could not be recorded. No payment was submitted.");
      const { stripe, elements } = payment.current || {};
      if (!stripe) throw Error("Payment collection is not ready.");
      const submitted = await elements.submit();
      if (submitted.error) throw Error("Check your payment details in the secure Stripe form.");
      const result = await stripe.createConfirmationToken({ elements, params: { return_url: `${window.location.origin}/cohort/reservation` } });
      if (result.error || !result.confirmationToken) throw Error("Payment details could not be submitted.");
      setReservation(await apiClient.post("/api/cohort/reservation/pay", { confirmation_token: result.confirmationToken.id }, { headers: await headers() }));
    } catch (failure) { setError(failure.message || "Payment submission could not be verified. Check this page before trying again."); }
    finally { setBusy(false); }
  }
  async function continuePayment() {
    setBusy(true); setError("");
    try {
      const opts = { headers: await headers() };
      const result = await apiClient.post("/api/cohort/reservation/continue", {}, opts);
      if (result.client_secret) {
        const stripe = await stripeClient();
        const action = await stripe.handleNextAction({ clientSecret: result.client_secret });
        if (action.error) throw Error("Bank verification is not complete. Check your verification deadline.");
        setReservation(await apiClient.post("/api/cohort/reservation/continue", {}, opts));
      } else setReservation(result);
    } catch { setError("Your bank is still confirming this payment. This page will update when it's done."); }
    finally { setBusy(false); }
  }
  if (!isLoaded) return <main>Loading authentication…</main>;
  if (!isSignedIn) return <main><h1>Your Founding reservation</h1><Link to="/sign-in?redirect_url=%2Fcohort%2Freservation">Sign in to view your reservation</Link></main>;
  return <main className="max-w-2xl mx-auto p-8"><h1>Your Founding reservation</h1>
    <p>$495 USD one-time · lifetime Estate access · Self-paced with written instructor feedback on your brand work during the 90-day feedback window. No live sessions. <strong>Non-refundable. See <Link to="/enrollment-policy">Enrollment Policy</Link>.</strong></p>
    {error && <p role="alert">{error}</p>}
    {reservation && <>
      <p>Reservation: {reservation.state}</p>
      <p>Payment deadline: {deadlineLabel(reservation.payment_deadline)}</p>
      {reservation.verification_deadline && <p>Bank verification deadline: {deadlineLabel(reservation.verification_deadline)}</p>}
      {reservation.verification_timing_pending && <p>We're checking with your bank. Your verification deadline will appear here shortly.</p>}
      {reservation.state === "queued" && <p>All Founding seats are currently taken. You have not been charged.</p>}
      {reservation.state === "email_pending" && <p>Your seat is reserved. We're sending your acceptance email now, and this page will update when you can pay.</p>}
      {reservation.state === "released" && <p>This reservation has ended. No new payment can be submitted for it.</p>}
      {reservation.price_compatibility_review && <p role="status">This existing payment requires price compatibility review. No new payment can be submitted; its recorded amount has not been changed.</p>}
      {reservation.state === "paid" && !reservation.price_compatibility_review && <p>Payment confirmed. Check your email from hello@coretruthhouse.com for your claim link to open your workspace. Didn't get it within 10 minutes? Email hello@coretruthhouse.com.</p>}
      {reservation.can_submit && <><div ref={mount} /><p>Submit payment before the deadline shown above.</p><p>Your $495 Founding Cohort fee is non-refundable except as stated in our <Link to="/enrollment-policy">Enrollment Policy</Link>.</p><label><input type="checkbox" required checked={policyAccepted} onChange={(e) => setPolicyAccepted(e.target.checked)} /> I am a US resident, and I understand my $495 Founding Cohort fee is non-refundable except as stated in the Enrollment Policy.</label><button disabled={busy || !policyAccepted} onClick={pay}>Pay $495 USD once</button></>}
      {reservation.state === "payment_pending" && !reservation.price_compatibility_review && <><p>Your seat is held while your payment processes. If your bank asks you to verify, finish within 24 hours.</p><button disabled={busy} onClick={continuePayment}>Continue payment verification</button></>}
    </>}
  </main>;
}

import Stripe from "stripe";

const stripeKey = process.env.STRIPE_SECRET_KEY;
if (!stripeKey && process.env.NODE_ENV === "production") {
  console.error(
    "[stripe] STRIPE_SECRET_KEY is not set — payment features will fail",
  );
}

export const stripe = new Stripe(stripeKey ?? "", {
  apiVersion: "2023-10-16",
  typescript: true,
});

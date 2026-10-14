import type { CheckoutResponse } from '@housingcom/contracts';

/** Messages posted from the checkout page to the app. */
export type CheckoutMessage =
  | {
      type: 'success';
      razorpay_payment_id: string;
      razorpay_order_id: string;
      razorpay_signature: string;
    }
  | { type: 'dismiss' }
  | { type: 'failed'; reason: string | null }
  | { type: 'error'; reason: string };

/** Razorpay Standard Checkout. Loaded inside the app's WebView; nothing is hosted by us. */
const CHECKOUT_SCRIPT = 'https://checkout.razorpay.com/v1/checkout.js';

/**
 * Builds the page that opens Razorpay Checkout immediately. `webview_intent` makes Checkout
 * list installed UPI apps and hand off via intent links, which the WebView forwards to the OS.
 */
export function checkoutHtml(c: CheckoutResponse, themeColor: string): string {
  const options = {
    key: c.keyId,
    order_id: c.gatewayOrderId,
    amount: c.amountPaise,
    currency: c.currency,
    name: c.businessName,
    description: c.description,
    prefill: {
      name: c.prefill.name ?? undefined,
      email: c.prefill.email ?? undefined,
      contact: c.prefill.contact ?? undefined,
    },
    theme: { color: themeColor },
    webview_intent: true,
  };
  // JSON inside <script>: escape "<" so a value can never close the tag.
  const json = JSON.stringify(options).replace(/</g, '\\u003c');
  return `<!doctype html>
<html><head><meta name="viewport" content="width=device-width,initial-scale=1"/>
<style>html,body{margin:0;height:100%;background:transparent}</style></head>
<body>
<script src="${CHECKOUT_SCRIPT}"></script>
<script>
  function post(m) { window.ReactNativeWebView.postMessage(JSON.stringify(m)); }
  try {
    var options = ${json};
    options.handler = function (r) { post(Object.assign({ type: 'success' }, r)); };
    options.modal = { ondismiss: function () { post({ type: 'dismiss' }); }, confirm_close: true };
    var rzp = new Razorpay(options);
    rzp.on('payment.failed', function (e) {
      post({ type: 'failed', reason: (e && e.error && e.error.description) || null });
    });
    rzp.open();
  } catch (e) {
    post({ type: 'error', reason: String(e && e.message || e) });
  }
</script>
</body></html>`;
}

/**
 * Turns Android `intent://…#Intent;scheme=upi;…;end` links into `upi://…` so the OS opens
 * the UPI app. Other non-web links (upi:, tez:, phonepe:, paytmmp:…) pass through.
 */
export function toAppUrl(url: string): string {
  if (!url.startsWith('intent://')) return url;
  const scheme = /;scheme=([^;]+);/.exec(url)?.[1];
  const target = url.slice('intent://'.length, url.indexOf('#Intent'));
  return scheme ? `${scheme}://${target}` : url;
}

export const isWebUrl = (url: string) =>
  url.startsWith('https://') || url.startsWith('http://') || url === 'about:blank';

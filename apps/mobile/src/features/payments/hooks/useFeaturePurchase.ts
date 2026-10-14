import { FAKE_CHECKOUT, PaymentDriver, type CheckoutResponse } from '@housingcom/contracts';
import { useToast } from '@housingcom/ui';
import * as Crypto from 'expo-crypto';
import { useState } from 'react';
import {
  useFeatureCheckoutMutation,
  useVerifyPaymentMutation,
} from '@/features/featured/featured.api';
import { toAppError } from '@/shared/api/api-error';
import type { CheckoutResult } from '../components/RazorpayCheckoutSheet';

export type PurchaseState = 'idle' | 'starting' | 'paying' | 'confirming';

/**
 * Pay for a featured plan: create the order → Razorpay Checkout → verify on the server
 * (which features the listing before it answers). With the dev-only `fake` driver the
 * payment is simulated after a confirmation, so the flow can be tried without real money.
 */
export function useFeaturePurchase(onFeatured: () => void) {
  const toast = useToast();
  const [createCheckout] = useFeatureCheckoutMutation();
  const [verify] = useVerifyPaymentMutation();
  const [state, setState] = useState<PurchaseState>('idle');
  const [checkout, setCheckout] = useState<CheckoutResponse | null>(null);
  const [simulating, setSimulating] = useState<CheckoutResponse | null>(null);

  const confirm = async (c: CheckoutResponse, result: CheckoutResult) => {
    setCheckout(null);
    setSimulating(null);
    setState('confirming');
    try {
      await verify({ paymentId: c.paymentId, body: result }).unwrap();
      toast.show({ message: 'Payment received. Your listing is now featured!' });
      onFeatured();
    } catch (e) {
      toast.show({ message: toAppError(e).message, duration: 'long' });
    } finally {
      setState('idle');
    }
  };

  const start = async (listingId: string, planId: string) => {
    setState('starting');
    try {
      const c = await createCheckout({ listingId, planId }).unwrap();
      setState('paying');
      if (c.driver === PaymentDriver.Fake) setSimulating(c);
      else setCheckout(c);
    } catch (e) {
      setState('idle');
      toast.show({ message: toAppError(e).message });
    }
  };

  return {
    state,
    start,
    /** Props for <RazorpayCheckoutSheet>. */
    sheet: {
      checkout,
      onSuccess: (r: CheckoutResult) => checkout && void confirm(checkout, r),
      onClose: (reason: string | null) => {
        setCheckout(null);
        setState('idle');
        toast.show({ message: reason ?? 'Payment cancelled. You have not been charged.' });
      },
    },
    /** Dev/test only: the simulated payment awaiting confirmation. */
    simulation: {
      visible: !!simulating,
      amountInr: simulating ? simulating.amountPaise / 100 : 0,
      confirm: () =>
        simulating &&
        void confirm(simulating, {
          gatewayOrderId: simulating.gatewayOrderId,
          gatewayPaymentId: `${FAKE_CHECKOUT.paymentIdPrefix}${Crypto.randomUUID().slice(0, 12)}`,
          signature: FAKE_CHECKOUT.signature,
        }),
      cancel: () => {
        setSimulating(null);
        setState('idle');
      },
    },
  };
}

import type { CheckoutResponse } from '@housingcom/contracts';
import { AppText, Button, HStack, Loader, VStack, useTheme } from '@housingcom/ui';
import * as Linking from 'expo-linking';
import { useState } from 'react';
import { Modal, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';
import { checkoutHtml, isWebUrl, toAppUrl, type CheckoutMessage } from '../checkout-html';

export interface CheckoutResult {
  gatewayOrderId: string;
  gatewayPaymentId: string;
  signature: string;
}

interface Props {
  checkout: CheckoutResponse | null;
  onSuccess: (result: CheckoutResult) => void;
  onClose: (reason: string | null) => void;
}

/**
 * Razorpay Checkout in a full-screen sheet. Cards, netbanking and wallets run in the page;
 * UPI apps (GPay, PhonePe, Paytm…) are opened through the OS and return to the sheet.
 */
export function RazorpayCheckoutSheet({ checkout, onSuccess, onClose }: Props) {
  const { colors, spacing } = useTheme();
  const [loading, setLoading] = useState(true);
  const [lastFailure, setLastFailure] = useState<string | null>(null);

  const onMessage = (e: WebViewMessageEvent) => {
    if (!checkout) return;
    const m = JSON.parse(e.nativeEvent.data) as CheckoutMessage;
    switch (m.type) {
      case 'success':
        onSuccess({
          gatewayOrderId: m.razorpay_order_id,
          gatewayPaymentId: m.razorpay_payment_id,
          signature: m.razorpay_signature,
        });
        break;
      case 'failed':
        // Checkout stays open and lets the user retry another method.
        setLastFailure(m.reason);
        break;
      case 'dismiss':
        onClose(lastFailure);
        break;
      case 'error':
        onClose(m.reason);
        break;
    }
  };

  return (
    <Modal
      visible={!!checkout}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={() => onClose(lastFailure)}
    >
      <SafeAreaView style={[styles.fill, { backgroundColor: colors.background }]}>
        <HStack justify="space-between" align="center" style={{ padding: spacing.md }}>
          <AppText variant="heading">Secure payment</AppText>
          <Button
            label="Close"
            variant="text"
            fullWidth={false}
            onPress={() => onClose(lastFailure)}
          />
        </HStack>
        {checkout ? (
          <View style={styles.fill}>
            <WebView
              originWhitelist={['*']}
              source={{
                html: checkoutHtml(checkout, colors.primary),
                baseUrl: 'https://checkout.razorpay.com',
              }}
              onMessage={onMessage}
              onLoadEnd={() => setLoading(false)}
              javaScriptEnabled
              domStorageEnabled
              setSupportMultipleWindows={false}
              // UPI and other app links leave the WebView for the installed app.
              onShouldStartLoadWithRequest={(req) => {
                if (isWebUrl(req.url)) return true;
                void Linking.openURL(toAppUrl(req.url)).catch(() =>
                  setLastFailure('That payment app is not installed. Choose another method.'),
                );
                return false;
              }}
              style={styles.fill}
            />
            {loading ? (
              <VStack style={StyleSheet.absoluteFill} align="center" justify="center">
                <Loader />
              </VStack>
            ) : null}
          </View>
        ) : null}
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({ fill: { flex: 1 } });

import { ContactChannel, type ListingDetailResponse } from '@housingcom/contracts';
import { AppText, Button, Sheet, VStack, useToast } from '@housingcom/ui';
import * as Linking from 'expo-linking';
import { router } from 'expo-router';
import { useState } from 'react';
import { toAppError } from '@/shared/api/api-error';
import { useContactOwnerMutation } from '../engagement.api';

interface ContactSheetProps {
  listing: ListingDetailResponse;
  visible: boolean;
  onDismiss: () => void;
  onRequestVisit: () => void;
}

/** Opens the phone dialer / WhatsApp app / in-app chat. The owner's number is fetched on tap. */
export function ContactSheet({ listing, visible, onDismiss, onRequestVisit }: ContactSheetProps) {
  const toast = useToast();
  const [contact] = useContactOwnerMutation();
  const [busy, setBusy] = useState<ContactChannel | null>(null);

  const go = async (channel: ContactChannel) => {
    setBusy(channel);
    try {
      const res = await contact({ listingId: listing.id, channel }).unwrap();
      onDismiss();
      if (channel === ContactChannel.Chat && res.conversationId) {
        router.push(`/chat/${res.conversationId}`);
        return;
      }
      if (!res.phone) {
        toast.show({ message: "The owner hasn't shared a phone number. Try chat instead." });
        return;
      }
      if (channel === ContactChannel.Call) {
        await Linking.openURL(`tel:${res.phone}`);
      } else {
        const text = encodeURIComponent(
          `Hi, I saw your listing "${listing.title}" on Housing. Is it still available?`,
        );
        const digits = res.phone.replace(/[^\d]/g, '');
        // Native WhatsApp when installed, otherwise wa.me hands off to it or the store.
        await Linking.openURL(`whatsapp://send?phone=${digits}&text=${text}`).catch(() =>
          Linking.openURL(`https://wa.me/${digits}?text=${text}`),
        );
      }
    } catch (e) {
      toast.show({ message: toAppError(e).message });
    } finally {
      setBusy(null);
    }
  };

  return (
    <Sheet visible={visible} onDismiss={onDismiss} title="Contact owner">
      <VStack gap="sm">
        <AppText color="textSecondary">
          {listing.owner.name ?? 'The owner'} usually replies within a day. Be polite and mention
          when you’d like to move in.
        </AppText>
        <Button
          label="Call"
          loading={busy === ContactChannel.Call}
          onPress={() => void go(ContactChannel.Call)}
        />
        <Button
          label="WhatsApp"
          variant="tonal"
          loading={busy === ContactChannel.WhatsApp}
          onPress={() => void go(ContactChannel.WhatsApp)}
        />
        <Button
          label="Chat in app"
          variant="tonal"
          loading={busy === ContactChannel.Chat}
          onPress={() => void go(ContactChannel.Chat)}
        />
        <Button
          label="Schedule a visit"
          variant="outlined"
          onPress={() => {
            onDismiss();
            onRequestVisit();
          }}
        />
      </VStack>
    </Sheet>
  );
}

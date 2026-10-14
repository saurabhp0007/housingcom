import { REPORT_REASON_LABELS, ReportReason } from '@housingcom/contracts';
import { AppText, Button, Chip, HStack, Sheet, TextField, VStack, useToast } from '@housingcom/ui';
import { useState } from 'react';
import { toAppError } from '@/shared/api/api-error';
import { useReportListingMutation } from '../engagement.api';

interface ReportSheetProps {
  listingId: string;
  visible: boolean;
  onDismiss: () => void;
}

export function ReportSheet({ listingId, visible, onDismiss }: ReportSheetProps) {
  const toast = useToast();
  const [reason, setReason] = useState<ReportReason | null>(null);
  const [details, setDetails] = useState('');
  const [report, { isLoading }] = useReportListingMutation();

  const submit = async () => {
    if (!reason) return;
    try {
      await report({ listingId, body: { reason, details: details.trim() || undefined } }).unwrap();
      onDismiss();
      setReason(null);
      setDetails('');
      toast.show({ message: 'Thanks. Our team will review this listing.' });
    } catch (e) {
      toast.show({ message: toAppError(e).message });
    }
  };

  return (
    <Sheet
      visible={visible}
      onDismiss={onDismiss}
      title="Report listing"
      snapPoints={['half', 'full']}
    >
      <VStack gap="md">
        <AppText color="textSecondary">What’s wrong with this listing?</AppText>
        <HStack gap="xs" wrap>
          {Object.values(ReportReason).map((r) => (
            <Chip
              key={r}
              label={REPORT_REASON_LABELS[r]}
              selected={reason === r}
              onPress={() => setReason(r)}
            />
          ))}
        </HStack>
        <TextField
          label="Details (optional)"
          value={details}
          onChangeText={setDetails}
          maxLength={500}
          multiline
        />
        <Button
          label="Submit report"
          variant="destructive"
          disabled={!reason}
          loading={isLoading}
          onPress={() => void submit()}
        />
      </VStack>
    </Sheet>
  );
}

import { Button, Chip, HStack, Sheet, TextField, VStack } from '@housingcom/ui';
import { useState } from 'react';

interface RejectSheetProps {
  visible: boolean;
  title: string;
  presets: string[];
  loading?: boolean;
  onDismiss: () => void;
  onSubmit: (reason: string) => void;
}

/** Native bottom sheet to collect a rejection reason (quick presets + free text). */
export function RejectSheet({
  visible,
  title,
  presets,
  loading,
  onDismiss,
  onSubmit,
}: RejectSheetProps) {
  const [reason, setReason] = useState('');
  const valid = reason.trim().length >= 5;

  return (
    <Sheet visible={visible} onDismiss={onDismiss} title={title} snapPoints={['half', 'full']}>
      <VStack gap="md">
        <HStack gap="sm" wrap>
          {presets.map((p) => (
            <Chip key={p} label={p} selected={reason === p} onPress={() => setReason(p)} />
          ))}
        </HStack>
        <TextField
          label="Reason shown to the user"
          value={reason}
          onChangeText={setReason}
          multiline
          maxLength={500}
          helperText="Be specific so they can fix it and resubmit."
        />
        <Button
          label="Reject"
          variant="destructive"
          disabled={!valid}
          loading={loading}
          onPress={() => onSubmit(reason.trim())}
        />
      </VStack>
    </Sheet>
  );
}

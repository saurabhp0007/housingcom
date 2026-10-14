import { VISIT_SLOT_LABELS, VisitSlot } from '@housingcom/contracts';
import {
  AppText,
  Button,
  Chip,
  DateField,
  HStack,
  Sheet,
  TextField,
  VStack,
  useToast,
} from '@housingcom/ui';
import { useState } from 'react';
import { toAppError } from '@/shared/api/api-error';
import { useRequestVisitMutation } from '../engagement.api';

const MAX_DAYS_AHEAD = 60;

/** YYYY-MM-DD in local time (the user's calendar day). */
const isoDay = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

interface VisitSheetProps {
  listingId: string;
  visible: boolean;
  onDismiss: () => void;
}

export function VisitSheet({ listingId, visible, onDismiss }: VisitSheetProps) {
  const toast = useToast();
  const today = new Date();
  const maxDate = new Date(today.getTime() + MAX_DAYS_AHEAD * 86_400_000);
  const [date, setDate] = useState(() => new Date(today.getTime() + 86_400_000));
  const [slot, setSlot] = useState<VisitSlot>(VisitSlot.Evening);
  const [note, setNote] = useState('');
  const [requestVisit, { isLoading }] = useRequestVisitMutation();

  const submit = async () => {
    try {
      await requestVisit({
        listingId,
        body: { date: isoDay(date), slot, note: note.trim() || undefined },
      }).unwrap();
      onDismiss();
      toast.show({ message: "Visit requested. We'll notify you when the owner confirms." });
    } catch (e) {
      toast.show({ message: toAppError(e).message });
    }
  };

  return (
    <Sheet visible={visible} onDismiss={onDismiss} title="Schedule a visit">
      <VStack gap="md">
        <DateField
          label="Date"
          value={date}
          onChange={setDate}
          minimumDate={today}
          maximumDate={maxDate}
        />
        <VStack gap="xs">
          <AppText variant="label" color="textSecondary">
            TIME
          </AppText>
          <HStack gap="xs" wrap>
            {Object.values(VisitSlot).map((s) => (
              <Chip
                key={s}
                label={VISIT_SLOT_LABELS[s]}
                selected={slot === s}
                onPress={() => setSlot(s)}
              />
            ))}
          </HStack>
        </VStack>
        <TextField
          label="Note for the owner (optional)"
          value={note}
          onChangeText={setNote}
          maxLength={300}
          multiline
        />
        <Button label="Request visit" loading={isLoading} onPress={() => void submit()} />
      </VStack>
    </Sheet>
  );
}

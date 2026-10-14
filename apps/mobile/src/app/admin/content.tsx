import {
  CONTENT_PAGE_TITLES,
  ContentPageSlug,
  type BannerResponse,
  type FaqResponse,
} from '@housingcom/contracts';
import {
  AppText,
  Button,
  Card,
  Chip,
  ConfirmDialog,
  DateField,
  HStack,
  Pill,
  Screen,
  Sheet,
  TextField,
  Toggle,
  VStack,
  useTheme,
  useToast,
} from '@housingcom/ui';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { Pressable, View } from 'react-native';
import {
  contentApi,
  useAdminBannersQuery,
  useAdminFaqsQuery,
  useContentPageQuery,
  useDeleteBannerMutation,
  useDeleteFaqMutation,
  useSaveBannerMutation,
  useSaveFaqMutation,
  useSavePageMutation,
} from '@/features/content/content.api';
import { uploadBannerImage } from '@/features/content/content-upload.service';
import { useCitiesQuery } from '@/features/location/geo.api';
import { toAppError } from '@/shared/api/api-error';
import { UploadError } from '@/shared/api/upload';
import { useAppDispatch } from '@/shared/store/hooks';

type Tab = 'faqs' | 'pages' | 'banners';

/** Basic content (PRD §5): FAQs, terms / privacy / about, and Home banners. */
export default function AdminContentScreen() {
  const [tab, setTab] = useState<Tab>('faqs');
  return (
    <Screen scroll edges={['bottom']}>
      <VStack gap="lg" style={{ paddingVertical: 16 }}>
        <HStack gap="sm">
          <Chip label="FAQs" selected={tab === 'faqs'} onPress={() => setTab('faqs')} />
          <Chip label="Pages" selected={tab === 'pages'} onPress={() => setTab('pages')} />
          <Chip label="Banners" selected={tab === 'banners'} onPress={() => setTab('banners')} />
        </HStack>
        {tab === 'faqs' ? <Faqs /> : tab === 'pages' ? <Pages /> : <Banners />}
      </VStack>
    </Screen>
  );
}

// ── FAQs ────────────────────────────────────────────────

function Faqs() {
  const { data } = useAdminFaqsQuery();
  const [editing, setEditing] = useState<FaqResponse | 'new' | null>(null);
  return (
    <VStack gap="sm">
      <Button label="Add question" onPress={() => setEditing('new')} />
      {data?.map((f) => (
        <Pressable key={f.id} accessibilityRole="button" onPress={() => setEditing(f)}>
          <Card tone={f.isPublished ? 'surface' : 'muted'}>
            <VStack gap="xxs">
              <HStack justify="space-between" gap="sm">
                <AppText variant="bodyStrong" style={{ flex: 1 }}>
                  {f.question}
                </AppText>
                {!f.isPublished ? <Pill label="Draft" /> : null}
              </HStack>
              <AppText color="textSecondary" numberOfLines={2}>
                {f.answer}
              </AppText>
            </VStack>
          </Card>
        </Pressable>
      ))}
      {editing ? (
        <FaqSheet faq={editing === 'new' ? null : editing} onDismiss={() => setEditing(null)} />
      ) : null}
    </VStack>
  );
}

function FaqSheet({ faq, onDismiss }: { faq: FaqResponse | null; onDismiss: () => void }) {
  const toast = useToast();
  const [question, setQuestion] = useState(faq?.question ?? '');
  const [answer, setAnswer] = useState(faq?.answer ?? '');
  const [published, setPublished] = useState(faq?.isPublished ?? true);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [save, { isLoading }] = useSaveFaqMutation();
  const [remove] = useDeleteFaqMutation();

  const submit = async () => {
    try {
      await save({
        id: faq?.id,
        body: { question: question.trim(), answer: answer.trim(), isPublished: published },
      }).unwrap();
      onDismiss();
    } catch (e) {
      toast.show({ message: toAppError(e).message });
    }
  };

  return (
    <Sheet
      visible
      onDismiss={onDismiss}
      title={faq ? 'Edit question' : 'New question'}
      snapPoints={['full']}
    >
      <VStack gap="md">
        <TextField label="Question" value={question} onChangeText={setQuestion} maxLength={200} />
        <TextField
          label="Answer"
          value={answer}
          onChangeText={setAnswer}
          maxLength={2000}
          multiline
        />
        <Toggle label="Published" value={published} onValueChange={setPublished} />
        <Button
          label="Save"
          disabled={question.trim().length < 5 || answer.trim().length < 2}
          loading={isLoading}
          onPress={() => void submit()}
        />
        {faq ? (
          <Button label="Delete" variant="text" onPress={() => setConfirmDelete(true)} />
        ) : null}
      </VStack>
      <ConfirmDialog
        visible={confirmDelete}
        title="Delete this question?"
        confirmLabel="Delete"
        destructive
        onDismiss={() => setConfirmDelete(false)}
        onConfirm={() => {
          setConfirmDelete(false);
          if (faq) void remove(faq.id).then(onDismiss);
        }}
      />
    </Sheet>
  );
}

// ── Pages ───────────────────────────────────────────────

function Pages() {
  const [slug, setSlug] = useState<ContentPageSlug>(ContentPageSlug.Terms);
  return (
    <VStack gap="md">
      <HStack gap="xs" wrap>
        {Object.values(ContentPageSlug).map((s) => (
          <Chip
            key={s}
            label={CONTENT_PAGE_TITLES[s]}
            selected={slug === s}
            onPress={() => setSlug(s)}
          />
        ))}
      </HStack>
      {/* Keyed by slug so the editor reloads for each page. */}
      <PageEditor key={slug} slug={slug} />
    </VStack>
  );
}

function PageEditor({ slug }: { slug: ContentPageSlug }) {
  const { data, isLoading } = useContentPageQuery(slug);
  if (isLoading || !data) return null;
  return <PageForm slug={slug} initialTitle={data.title} initialBody={data.body} />;
}

function PageForm({
  slug,
  initialTitle,
  initialBody,
}: {
  slug: ContentPageSlug;
  initialTitle: string;
  initialBody: string;
}) {
  const toast = useToast();
  const [title, setTitle] = useState(initialTitle);
  const [body, setBody] = useState(initialBody);
  const [save, { isLoading }] = useSavePageMutation();
  return (
    <VStack gap="md">
      <TextField label="Title" value={title} onChangeText={setTitle} maxLength={100} />
      <TextField
        label="Text"
        helperText="Plain text. Leave a blank line between paragraphs."
        value={body}
        onChangeText={setBody}
        multiline
      />
      <Button
        label="Publish"
        disabled={title.trim().length < 2 || !body.trim()}
        loading={isLoading}
        onPress={() =>
          void save({ slug, body: { title: title.trim(), body: body.trim() } })
            .unwrap()
            .then(() => toast.show({ message: 'Published' }))
            .catch((e: unknown) => toast.show({ message: toAppError(e).message }))
        }
      />
    </VStack>
  );
}

// ── Banners ─────────────────────────────────────────────

function Banners() {
  const { data } = useAdminBannersQuery();
  const { data: cities } = useCitiesQuery();
  const [editing, setEditing] = useState<BannerResponse | 'new' | null>(null);
  const cityName = (id: string | null) =>
    id ? (cities?.find((c) => c.id === id)?.name ?? 'One city') : 'All cities';

  return (
    <VStack gap="sm">
      <Button label="Add banner" onPress={() => setEditing('new')} />
      {data?.map((b) => (
        <Pressable key={b.id} accessibilityRole="button" onPress={() => setEditing(b)}>
          <Card tone={b.isActive ? 'surface' : 'muted'}>
            <HStack gap="md" align="center">
              {b.imageUrl ? (
                <Image
                  source={{ uri: b.imageUrl }}
                  style={{ width: 80, height: 40, borderRadius: 6 }}
                />
              ) : null}
              <VStack flex={1} gap="xxs">
                <AppText variant="bodyStrong">{b.title}</AppText>
                <AppText variant="caption" color="textSecondary">
                  {cityName(b.cityId)}
                  {b.endsAt ? ` · until ${new Date(b.endsAt).toLocaleDateString('en-IN')}` : ''}
                  {b.isActive ? '' : ' · off'}
                </AppText>
              </VStack>
            </HStack>
          </Card>
        </Pressable>
      ))}
      {editing ? (
        <BannerSheet
          banner={editing === 'new' ? null : editing}
          onDismiss={() => setEditing(null)}
        />
      ) : null}
    </VStack>
  );
}

function BannerSheet({
  banner,
  onDismiss,
}: {
  banner: BannerResponse | null;
  onDismiss: () => void;
}) {
  const toast = useToast();
  const { colors, radius } = useTheme();
  const dispatch = useAppDispatch();
  const { data: cities } = useCitiesQuery();
  const [title, setTitle] = useState(banner?.title ?? '');
  const [subtitle, setSubtitle] = useState(banner?.subtitle ?? '');
  const [link, setLink] = useState(banner?.linkUrl ?? '');
  const [cityId, setCityId] = useState<string | null>(banner?.cityId ?? null);
  const [active, setActive] = useState(banner?.isActive ?? true);
  const [hasEnd, setHasEnd] = useState(!!banner?.endsAt);
  const [endsAt, setEndsAt] = useState(() =>
    banner?.endsAt ? new Date(banner.endsAt) : new Date(Date.now() + 7 * 86_400_000),
  );
  const [image, setImage] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [uploading, setUploading] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [save, { isLoading }] = useSaveBannerMutation();
  const [remove] = useDeleteBannerMutation();

  const pick = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.9,
      allowsEditing: true,
      aspect: [2, 1],
    });
    if (!res.canceled) setImage(res.assets[0] ?? null);
  };

  const submit = async () => {
    try {
      const saved = await save({
        id: banner?.id,
        body: {
          title: title.trim(),
          subtitle: subtitle.trim() || null,
          linkUrl: link.trim() || null,
          cityId,
          isActive: active,
          endsAt: hasEnd ? endsAt.toISOString() : null,
        },
      }).unwrap();
      if (image) {
        setUploading(true);
        await uploadBannerImage(saved.id, image);
        dispatch(contentApi.util.invalidateTags(['Content']));
      }
      onDismiss();
    } catch (e) {
      toast.show({ message: e instanceof UploadError ? e.message : toAppError(e).message });
    } finally {
      setUploading(false);
    }
  };

  const preview = image?.uri ?? banner?.imageUrl ?? null;

  return (
    <Sheet
      visible
      onDismiss={onDismiss}
      title={banner ? 'Edit banner' : 'New banner'}
      snapPoints={['full']}
    >
      <VStack gap="md">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Choose image"
          onPress={() => void pick()}
        >
          <View
            style={{
              aspectRatio: 2,
              borderRadius: radius.lg,
              overflow: 'hidden',
              backgroundColor: colors.surfaceMuted,
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            {preview ? (
              <Image
                source={{ uri: preview }}
                style={{ width: '100%', height: '100%' }}
                contentFit="cover"
              />
            ) : (
              <AppText color="textSecondary">Tap to add an image (optional)</AppText>
            )}
          </View>
        </Pressable>
        <TextField label="Title" value={title} onChangeText={setTitle} maxLength={80} />
        <TextField
          label="Subtitle (optional)"
          value={subtitle}
          onChangeText={setSubtitle}
          maxLength={160}
        />
        <TextField
          label="Link (optional)"
          helperText="An app screen like /search or /help, or an https:// link."
          autoCapitalize="none"
          keyboard="url"
          value={link}
          onChangeText={setLink}
        />
        <VStack gap="xs">
          <AppText variant="label" color="textSecondary">
            SHOW IN
          </AppText>
          <HStack gap="xs" wrap>
            <Chip label="All cities" selected={!cityId} onPress={() => setCityId(null)} />
            {cities?.map((c) => (
              <Chip
                key={c.id}
                label={c.name}
                selected={cityId === c.id}
                onPress={() => setCityId(c.id)}
              />
            ))}
          </HStack>
        </VStack>
        <Toggle label="Active" value={active} onValueChange={setActive} />
        <Toggle label="Ends on a date" value={hasEnd} onValueChange={setHasEnd} />
        {hasEnd ? (
          <DateField label="Ends on" value={endsAt} onChange={setEndsAt} minimumDate={new Date()} />
        ) : null}
        <Button
          label="Save banner"
          disabled={title.trim().length < 2}
          loading={isLoading || uploading}
          onPress={() => void submit()}
        />
        {banner ? (
          <Button label="Delete" variant="text" onPress={() => setConfirmDelete(true)} />
        ) : null}
      </VStack>
      <ConfirmDialog
        visible={confirmDelete}
        title="Delete this banner?"
        confirmLabel="Delete"
        destructive
        onDismiss={() => setConfirmDelete(false)}
        onConfirm={() => {
          setConfirmDelete(false);
          if (banner) void remove(banner.id).then(onDismiss);
        }}
      />
    </Sheet>
  );
}

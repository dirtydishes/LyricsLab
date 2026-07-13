import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { EditorWebView, type EditorWebViewHandle } from './EditorWebView';
import { SuggestionBar } from './SuggestionBar';
import {
  bodySnapshotsEqual,
  createAsyncTaskQueue,
  mergeBodySaveResult,
  type AsyncTaskQueue,
} from './bodyPersistence';
import type { EditorBodySnapshot, SuggestionContext } from './bridge';
import type { WordSuggestion } from './suggestions';
import { useProductionRhyme } from '../platform/ProductionRhymeProvider';
import type { SongRepository } from '../songs/songRepository';
import type { Song, SongId } from '../songs/types';
import { useAppTheme } from '../settings/SettingsProvider';

const TITLE_SAVE_DEBOUNCE_MS = 450;
const BODY_SAVE_DEBOUNCE_MS = 550;
const BODY_EDITOR_BLUR_GRACE_MS = 180;

type LyricsEditorScreenProps = {
  onBack: () => void;
  repository: SongRepository;
  songId: SongId;
};

export function LyricsEditorScreen({
  onBack,
  repository,
  songId,
}: LyricsEditorScreenProps) {
  const { resolvedTheme, tokens } = useAppTheme();
  const { getSuggestionView, retry } = useProductionRhyme();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingBody, setIsSavingBody] = useState(false);
  const [isSavingTitle, setIsSavingTitle] = useState(false);
  const [isBodyEditorFocused, setIsBodyEditorFocused] = useState(false);
  const [pendingBody, setPendingBody] = useState<EditorBodySnapshot | null>(
    null,
  );
  const [selectionContext, setSelectionContext] =
    useState<SuggestionContext | null>(null);
  const [song, setSong] = useState<Song | null>(null);
  const [title, setTitle] = useState('');
  const bodySaveQueueRef = useRef<AsyncTaskQueue | null>(null);
  const bodyEditorBlurTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const editorWebViewRef = useRef<EditorWebViewHandle>(null);
  const latestBodyRef = useRef<EditorBodySnapshot | null>(null);
  const lastSavedBodyRef = useRef<EditorBodySnapshot>({
    bodyJson: null,
    bodyText: '',
  });
  const lastSavedTitleRef = useRef('');
  const titleRef = useRef('');
  const currentSongId = song?.id ?? null;
  bodySaveQueueRef.current ??= createAsyncTaskQueue();

  const clearBodyEditorBlurTimeout = useCallback(() => {
    if (bodyEditorBlurTimeoutRef.current) {
      clearTimeout(bodyEditorBlurTimeoutRef.current);
      bodyEditorBlurTimeoutRef.current = null;
    }
  }, []);

  useEffect(() => {
    titleRef.current = title;
  }, [title]);

  useEffect(() => {
    return () => {
      clearBodyEditorBlurTimeout();
    };
  }, [clearBodyEditorBlurTimeout]);

  useEffect(() => {
    let isMounted = true;

    async function loadSong() {
      setIsLoading(true);
      setError(null);

      try {
        const nextSong = await repository.getSong(songId);

        if (!isMounted) {
          return;
        }

        setSong(nextSong);
        setTitle(nextSong?.title ?? '');
        lastSavedBodyRef.current = {
          bodyJson: nextSong?.bodyJson ?? null,
          bodyText: nextSong?.bodyText ?? '',
        };
        latestBodyRef.current = lastSavedBodyRef.current;
        setIsBodyEditorFocused(false);
        setSelectionContext(null);
        lastSavedTitleRef.current = nextSong?.title ?? '';

        if (!nextSong) {
          setError('Song not found');
        }
      } catch (loadError) {
        if (isMounted) {
          setError(toErrorMessage(loadError));
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadSong();

    return () => {
      isMounted = false;
    };
  }, [repository, songId]);

  const saveTitle = useCallback(
    async (nextTitle: string) => {
      if (!currentSongId || nextTitle === lastSavedTitleRef.current) {
        return null;
      }

      setIsSavingTitle(true);
      setError(null);

      try {
        const updatedSong = await repository.updateSong(currentSongId, {
          title: nextTitle,
        });
        lastSavedTitleRef.current = updatedSong.title;
        setSong((currentSong) =>
          currentSong?.id === updatedSong.id
            ? {
                ...updatedSong,
                bodyJson: currentSong.bodyJson,
                bodyText: currentSong.bodyText,
              }
            : updatedSong,
        );
        return updatedSong;
      } catch (saveError) {
        setError(toErrorMessage(saveError));
        return null;
      } finally {
        setIsSavingTitle(false);
      }
    },
    [currentSongId, repository],
  );

  const persistBody = useCallback(
    async (nextBody: EditorBodySnapshot) => {
      if (
        !currentSongId ||
        bodySnapshotsEqual(nextBody, lastSavedBodyRef.current)
      ) {
        return null;
      }

      setIsSavingBody(true);
      setError(null);

      try {
        const updatedSong = await repository.updateSong(currentSongId, {
          bodyJson: nextBody.bodyJson,
          bodyText: nextBody.bodyText,
        });
        lastSavedBodyRef.current = {
          bodyJson: updatedSong.bodyJson,
          bodyText: updatedSong.bodyText,
        };
        setSong((currentSong) =>
          currentSong?.id === updatedSong.id
            ? mergeBodySaveResult(currentSong, updatedSong, nextBody)
            : updatedSong,
        );
        setPendingBody((currentPendingBody) =>
          currentPendingBody && bodySnapshotsEqual(currentPendingBody, nextBody)
            ? null
            : currentPendingBody,
        );
        return updatedSong;
      } catch (saveError) {
        setError(toErrorMessage(saveError));
        return null;
      } finally {
        setIsSavingBody(false);
      }
    },
    [currentSongId, repository],
  );

  const saveBody = useCallback(
    (nextBody: EditorBodySnapshot | null) => {
      if (!nextBody) {
        return Promise.resolve(null);
      }

      const bodySaveQueue = bodySaveQueueRef.current;

      if (!bodySaveQueue) {
        return Promise.resolve(null);
      }

      return bodySaveQueue.enqueue(() => persistBody(nextBody));
    },
    [persistBody],
  );

  useEffect(() => {
    if (!currentSongId || title === lastSavedTitleRef.current) {
      return undefined;
    }

    const timeoutId = setTimeout(() => {
      void saveTitle(title);
    }, TITLE_SAVE_DEBOUNCE_MS);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [currentSongId, saveTitle, title]);

  useEffect(() => {
    if (
      !pendingBody ||
      bodySnapshotsEqual(pendingBody, lastSavedBodyRef.current)
    ) {
      return undefined;
    }

    const timeoutId = setTimeout(() => {
      void saveBody(pendingBody);
    }, BODY_SAVE_DEBOUNCE_MS);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [pendingBody, saveBody]);

  const handleBodyChanged = useCallback((nextBody: EditorBodySnapshot) => {
    latestBodyRef.current = nextBody;
    setPendingBody(nextBody);
    setSong((currentSong) =>
      currentSong
        ? {
            ...currentSong,
            bodyJson: nextBody.bodyJson,
            bodyText: nextBody.bodyText,
          }
        : currentSong,
    );
  }, []);

  const handleSelectionChanged = useCallback((context: SuggestionContext) => {
    setSelectionContext(context);
  }, []);

  const handleEditorFocused = useCallback(
    (context: SuggestionContext) => {
      clearBodyEditorBlurTimeout();
      setSelectionContext(context);
      setIsBodyEditorFocused(true);
    },
    [clearBodyEditorBlurTimeout],
  );

  const handleEditorBlurred = useCallback(
    (context: SuggestionContext) => {
      setSelectionContext(context);
      clearBodyEditorBlurTimeout();
      bodyEditorBlurTimeoutRef.current = setTimeout(() => {
        setIsBodyEditorFocused(false);
        bodyEditorBlurTimeoutRef.current = null;
      }, BODY_EDITOR_BLUR_GRACE_MS);
    },
    [clearBodyEditorBlurTimeout],
  );

  const suggestionView = useMemo(() => {
    if (!isBodyEditorFocused) {
      return {
        canRetry: false,
        kind: 'hidden' as const,
        suggestions: [],
      };
    }

    return getSuggestionView(selectionContext, song?.bodyText ?? '');
  }, [getSuggestionView, isBodyEditorFocused, selectionContext, song?.bodyText]);

  const handleSuggestionSelected = useCallback(
    (suggestion: WordSuggestion) => {
      clearBodyEditorBlurTimeout();
      setIsBodyEditorFocused(true);
      editorWebViewRef.current?.insertSuggestion(suggestion.word);
    },
    [clearBodyEditorBlurTimeout],
  );

  async function navigateBack() {
    await Promise.all([
      saveTitle(titleRef.current),
      saveBody(latestBodyRef.current),
    ]);
    onBack();
  }

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: tokens.background }]}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardArea}
      >
        <View style={styles.container}>
          <View style={styles.topBar}>
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                void navigateBack();
              }}
              style={({ pressed }) => [
                styles.backButton,
                { borderColor: tokens.border },
                pressed && styles.pressed,
              ]}
            >
              <Text style={[styles.backButtonText, { color: tokens.text }]}>
                Back
              </Text>
            </Pressable>
            <Text style={[styles.saveState, { color: tokens.textSecondary }]}>
              {isSavingTitle || isSavingBody ? 'Saving' : 'Saved'}
            </Text>
          </View>

          {isLoading ? (
            <View style={styles.centerState}>
              <ActivityIndicator color={tokens.accent} />
            </View>
          ) : song ? (
            <>
              <TextInput
                autoCapitalize="sentences"
                onBlur={() => {
                  void saveTitle(titleRef.current);
                }}
                onChangeText={setTitle}
                placeholder="Untitled Song"
                placeholderTextColor={tokens.placeholder}
                returnKeyType="done"
                style={[styles.titleInput, { color: tokens.text }]}
                value={title}
              />

              {error ? (
                <Text style={[styles.errorText, { color: tokens.danger }]}>
                  {error}
                </Text>
              ) : null}

              <EditorWebView
                bodyJson={song.bodyJson}
                bodyText={song.bodyText}
                onEditorBlurred={handleEditorBlurred}
                onContentChanged={handleBodyChanged}
                onEditorError={(message) => {
                  setError(message.message);
                }}
                onEditorFocused={handleEditorFocused}
                onSelectionChanged={handleSelectionChanged}
                ref={editorWebViewRef}
                theme={resolvedTheme}
              />

              {isBodyEditorFocused ? (
                <SuggestionBar
                  onSelectSuggestion={handleSuggestionSelected}
                  onRetry={() => {
                    void retry();
                  }}
                  view={suggestionView}
                />
              ) : null}
            </>
          ) : (
            <View style={styles.centerState}>
              <Text style={[styles.errorText, { color: tokens.danger }]}>
                {error ?? 'Song not found'}
              </Text>
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function toErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Something went wrong';
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  keyboardArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 18,
  },
  topBar: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  backButton: {
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    minHeight: 44,
    minWidth: 76,
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  backButtonText: {
    fontSize: 15,
    fontWeight: '800',
  },
  saveState: {
    fontSize: 13,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.72,
  },
  titleInput: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: 0,
    lineHeight: 34,
    marginBottom: 14,
    minHeight: 52,
    paddingVertical: 6,
  },
  errorText: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 12,
  },
  centerState: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
});

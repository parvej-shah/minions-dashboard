# Frontend architecture

How the client code under `src/app`, `src/components` and `src/hooks` is organised, and the rules that keep it that way. The backend equivalent is [backend.md](backend.md).

## Layers

```
page / layout (src/app)        composes components; no fetch calls
  -> screen component          layout and wiring for one screen
       -> data hook (src/hooks) loads, mutates, polls; owns the screen's state
            -> apiClient        the only way to call our own API
       -> UI kit (components/ui) tokens, Button, Card, Modal, Drawer, Toast ...
  -> lib/*Client, lib/*Draft   client-side helpers that are not React
```

A page stays under about 250 lines. When a screen grows past that, the data and actions move into a hook (`useIdeaStream`, `useOnboardingWizard`, `useEditorialDraft`) and each panel becomes a component.

## Rules

1. **One HTTP client.** Calls to our API use `apiClient` (or `useApiResource` for a GET that fills state). It throws `ApiRequestError` with the server's message, and sends an expired session to `/login`. A bare `fetch` is only for what `apiClient` cannot do: multipart uploads and binary responses (`/api/media/upload`, `/api/brand/cover-preview`).
2. **Errors reach the user.** A failed save or delete shows the server's message (`toErrorMessage`) in a toast or inline. A `catch` that does nothing must be about something the screen can do without (storage, an optional card).
3. **One shell per shape.** Dialogs use `ui/Modal` (`variant="sheet"` for the full-screen phone layout), form slide-overs use `ui/Drawer`, and transient messages use `ui/Toast` with `useToast`. Do not write `fixed inset-0` again.
4. **Shared pieces live in one place.** Class strings for settings forms are in `ui/fieldStyles`, date formats in `utils/date`, confetti in `ui/Confetti`, the long-run overlay in `common/RunProgressHUD` (a stage table and a colour theme per use).
5. **Pure logic is not in components.** Filtering and ordering (`lib/ideaFilter`), draft validation (`lib/onboardingDraft`) and the rules around a submit (`lib/onboardingSubmit`) are plain functions with tests.
6. **State that belongs together is one object.** The onboarding wizard keeps its answers in one `WizardFields` value that is saved to and restored from `localStorage`; do not add a `useState` per field.
7. **Comments say why.** No comment describes what the code used to be or which bug it fixed; that goes in the commit message.

## Where things are

| Need | Use |
|---|---|
| Load a list into a page | `useApiResource` |
| Add or remove a brand rule | `useDirectiveActions` |
| Start Google sign-in | `lib/googleSignIn` |
| Show a long n8n run | `DraftingProgressHUD` / `HarvestingProgressHUD` (configs over `RunProgressHUD`) |
| A confirm dialog | `ui/ConfirmModal` |

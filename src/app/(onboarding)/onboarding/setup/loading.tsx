import { WizardSkeleton } from "./_components/WizardSkeleton";

/** Painted while the server checks whether this workspace still needs setup. */
export default function SetupLoading() {
  return <WizardSkeleton />;
}

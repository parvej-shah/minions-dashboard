"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { Users, UserPlus, Mail, Trash2, Clock, RefreshCw } from "lucide-react";
import { useApiResource } from "@/hooks/useApiResource";
import { LoadingState } from "@/components/ui/EmptyState";
import ConfirmModal from "@/components/ui/ConfirmModal";
import { useToast } from "@/hooks/useToast";
import { apiClient, toErrorMessage } from "@/lib/api-client";
import type { TeamMember } from "@/types";

const ROLE_LABELS: Record<TeamMember["role"], string> = {
  OWNER: "Owner",
  MARKETING_DIRECTOR: "Marketing Director",
  MEMBER: "Member",
};

const INVITABLE_ROLES: TeamMember["role"][] = ["MARKETING_DIRECTOR", "MEMBER", "OWNER"];

export default function TeamPage() {
  const { data: session } = useSession();
  const { data: members, isLoading, reload } = useApiResource<TeamMember[]>("/api/team", [], {
    errorMessage: "Could not load team",
  });
  const toast = useToast(4000);

  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<TeamMember["role"]>("MEMBER");
  const [isInviting, setIsInviting] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<TeamMember | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);

  const currentRole = session?.user?.role;
  const canManage = currentRole === "OWNER" || currentRole === "MARKETING_DIRECTOR";

  const handleInvite = async () => {
    const email = inviteEmail.trim().toLowerCase();
    if (!email) return;
    setIsInviting(true);
    try {
      await apiClient.post("/api/team/invite", { email, role: inviteRole });
      toast.show(`Invited ${email}`);
      setInviteEmail("");
      setInviteRole("MEMBER");
      await reload();
    } catch (err) {
      toast.show(toErrorMessage(err, "Could not send invite"));
    } finally {
      setIsInviting(false);
    }
  };

  const handleRemove = async () => {
    if (!removeTarget) return;
    setIsRemoving(true);
    try {
      await apiClient.delete(`/api/team/${removeTarget.id}`);
      toast.show(`Removed ${removeTarget.email}`);
      setRemoveTarget(null);
      await reload();
    } catch (err) {
      toast.show(toErrorMessage(err, "Could not remove team member"));
    } finally {
      setIsRemoving(false);
    }
  };

  return (
    <div className="space-y-8 max-w-3xl mx-auto pb-16">
      <div className="border-b border-[#1F2D3D] pb-6">
        <div className="flex items-center gap-2 text-xs font-mono tracking-widest text-[#00C9A7] uppercase mb-1">
          <Users className="w-3.5 h-3.5" />
          Team
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-[#F1F5F9]">Team &amp; Access</h1>
        <p className="text-sm text-[#94A3B8] mt-1">
          Who has access to this workspace, and what they can do here.
        </p>
      </div>

      {canManage && (
        <div className="p-6 rounded-2xl bg-[#0F1419] border border-[#1F2D3D] space-y-4 shadow-sm">
          <h3 className="text-sm font-bold text-[#F1F5F9] flex items-center gap-2">
            <UserPlus className="w-4 h-4 text-[#00C9A7]" />
            Invite a Teammate
          </h3>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="teammate@company.com"
              className="flex-1 rounded-lg bg-[#070B0F] border border-[#1F2D3D] px-4 py-2.5 text-sm text-[#F1F5F9] placeholder:text-[#475569] focus:outline-none focus:border-[#00C9A7]"
            />
            <select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value as TeamMember["role"])}
              className="rounded-lg bg-[#070B0F] border border-[#1F2D3D] px-3 py-2.5 text-sm text-[#F1F5F9] focus:outline-none focus:border-[#00C9A7]"
            >
              {INVITABLE_ROLES.map((r) => (
                <option key={r} value={r}>
                  {ROLE_LABELS[r]}
                </option>
              ))}
            </select>
            <button
              onClick={handleInvite}
              disabled={isInviting || !inviteEmail.trim()}
              className="inline-flex items-center justify-center gap-2 bg-[#00C9A7] hover:bg-[#00A88A] text-[#070B0F] text-sm font-bold px-5 py-2.5 rounded-lg transition-all disabled:opacity-50"
            >
              {isInviting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
              <span>Invite</span>
            </button>
          </div>
        </div>
      )}

      <div className="p-6 rounded-2xl bg-[#0F1419] border border-[#1F2D3D] space-y-3 shadow-sm">
        <h3 className="text-sm font-bold text-[#F1F5F9]">Members ({members.length})</h3>

        {isLoading ? (
          <LoadingState label="Loading team…" />
        ) : (
          <div className="divide-y divide-[#1F2D3D]/60">
            {members.map((m) => (
              <div key={m.id} className="flex items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-[#F1F5F9] truncate">
                      {m.name || m.email}
                    </span>
                    {m.status === "PENDING" && (
                      <span className="flex items-center gap-1 text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#F59E0B]/10 text-[#F59E0B] border border-[#F59E0B]/30">
                        <Clock className="w-2.5 h-2.5" />
                        Pending
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#64748B] truncate">{m.email}</p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-[#161D26] text-[#94A3B8] border border-[#1F2D3D]">
                    {ROLE_LABELS[m.role]}
                  </span>
                  {canManage && (
                    <button
                      onClick={() => setRemoveTarget(m)}
                      title={m.status === "PENDING" ? "Cancel invite" : "Remove from team"}
                      className="p-1.5 rounded-lg text-[#64748B] hover:text-[#EF4444] hover:bg-[#EF4444]/10 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {toast.message && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#161D26] border border-[#1F2D3D] text-[#F1F5F9] px-4 py-3 rounded-xl shadow-2xl text-xs font-semibold">
          {toast.message}
        </div>
      )}

      <ConfirmModal
        isOpen={Boolean(removeTarget)}
        title={removeTarget?.status === "PENDING" ? "Cancel Invite" : "Remove Team Member"}
        description={
          removeTarget?.status === "PENDING"
            ? `Cancel the pending invite for ${removeTarget?.email}?`
            : `Remove ${removeTarget?.email} from this workspace? They will lose access immediately.`
        }
        confirmLabel={removeTarget?.status === "PENDING" ? "Cancel Invite" : "Remove"}
        cancelLabel="Keep"
        variant="danger"
        isLoading={isRemoving}
        onConfirm={handleRemove}
        onClose={() => setRemoveTarget(null)}
      />
    </div>
  );
}

"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { Users, UserPlus, Mail, Trash2, Clock, RefreshCw, Shield, Check } from "lucide-react";
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

const ROLE_DESCRIPTIONS: Record<TeamMember["role"], string> = {
  OWNER: "Full workspace ownership, billing, member and platform controls",
  MARKETING_DIRECTOR: "Team invites, brand directives, and editorial approval",
  MEMBER: "Drafting, content review, and telemetry analytics",
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
  const [updatingRoleId, setUpdatingRoleId] = useState<string | null>(null);

  const currentRole = session?.user?.role;
  const currentUserEmail = session?.user?.email;
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

  const handleRoleChange = async (member: TeamMember, newRole: TeamMember["role"]) => {
    if (member.role === newRole) return;
    setUpdatingRoleId(member.id);
    try {
      await apiClient.patch(`/api/team/${member.id}`, { role: newRole });
      toast.show(`Updated ${member.name || member.email} to ${ROLE_LABELS[newRole]}`);
      await reload();
    } catch (err) {
      toast.show(toErrorMessage(err, "Could not update member role"));
    } finally {
      setUpdatingRoleId(null);
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
    <div className="space-y-8 max-w-4xl mx-auto pb-16">
      <div className="border-b border-[#1F2D3D] pb-6">
        <div className="flex items-center gap-2 text-xs font-mono tracking-widest text-[#00C9A7] uppercase mb-1">
          <Users className="w-3.5 h-3.5" />
          Workspace Team
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-[#F1F5F9]">Team &amp; Access Control</h1>
        <p className="text-sm text-[#94A3B8] mt-1">
          Manage authorized workspace operators, invite colleagues, and configure role-based permissions.
        </p>
      </div>

      {canManage && (
        <div className="p-6 rounded-2xl bg-[#0F1419] border border-[#1F2D3D] space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#F1F5F9] flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-[#00C9A7]" />
              Invite Teammate
            </h3>
            <span className="text-[11px] font-mono text-[#64748B]">
              Google SSO Compatible
            </span>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Mail className="absolute left-3.5 top-3 w-4 h-4 text-[#475569]" />
              <input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="colleague@company.com"
                className="w-full rounded-xl bg-[#070B0F] border border-[#1F2D3D] pl-10 pr-4 py-2.5 text-sm text-[#F1F5F9] placeholder:text-[#475569] focus:outline-none focus:border-[#00C9A7]"
              />
            </div>
            <select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value as TeamMember["role"])}
              className="rounded-xl bg-[#070B0F] border border-[#1F2D3D] px-3.5 py-2.5 text-sm text-[#F1F5F9] focus:outline-none focus:border-[#00C9A7]"
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
              className="inline-flex items-center justify-center gap-2 bg-[#00C9A7] hover:bg-[#00A88A] text-[#070B0F] text-sm font-bold px-5 py-2.5 rounded-xl transition-all cursor-pointer disabled:opacity-50"
            >
              {isInviting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
              <span>Send Invite</span>
            </button>
          </div>
          <p className="text-[11px] text-[#64748B]">
            Invited members can sign in with their Google account to immediately access this workspace.
          </p>
        </div>
      )}

      {/* Members List */}
      <div className="p-6 rounded-2xl bg-[#0F1419] border border-[#1F2D3D] space-y-4 shadow-sm">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-[#F1F5F9] flex items-center gap-2">
            <Shield className="w-4 h-4 text-[#3B82F6]" />
            Active Workspace Members &amp; Invites ({members.length})
          </h3>
          <button
            onClick={() => reload()}
            className="text-xs text-[#64748B] hover:text-[#94A3B8] flex items-center gap-1 cursor-pointer"
          >
            <RefreshCw className="w-3 h-3" /> Refresh
          </button>
        </div>

        {isLoading ? (
          <LoadingState label="Loading team members…" />
        ) : members.length === 0 ? (
          <div className="py-8 text-center text-[#64748B] text-xs">
            No team members found for this workspace.
          </div>
        ) : (
          <div className="divide-y divide-[#1F2D3D]/60">
            {members.map((m) => {
              const isCurrentUser = m.email.toLowerCase() === currentUserEmail?.toLowerCase();
              const isUpdating = updatingRoleId === m.id;

              return (
                <div key={m.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-3.5">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-full bg-[#161D26] border border-[#1F2D3D] flex items-center justify-center font-bold text-xs text-[#00C9A7] shrink-0">
                      {m.name ? m.name[0].toUpperCase() : m.email[0].toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-[#F1F5F9] truncate">
                          {m.name || m.email}
                        </span>
                        {isCurrentUser && (
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#00C9A7]/10 text-[#00C9A7] border border-[#00C9A7]/30">
                            You
                          </span>
                        )}
                        {m.status === "PENDING" ? (
                          <span className="flex items-center gap-1 text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#F59E0B]/10 text-[#F59E0B] border border-[#F59E0B]/30">
                            <Clock className="w-2.5 h-2.5" />
                            Pending Invite
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            <Check className="w-2.5 h-2.5" />
                            Active
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[#64748B] truncate font-mono mt-0.5">{m.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                    {canManage && !isCurrentUser ? (
                      <select
                        value={m.role}
                        disabled={isUpdating}
                        onChange={(e) => handleRoleChange(m, e.target.value as TeamMember["role"])}
                        className="rounded-lg bg-[#070B0F] border border-[#1F2D3D] px-2.5 py-1 text-xs text-[#94A3B8] focus:text-[#F1F5F9] focus:outline-none focus:border-[#00C9A7] cursor-pointer disabled:opacity-50"
                      >
                        {INVITABLE_ROLES.map((r) => (
                          <option key={r} value={r}>
                            {ROLE_LABELS[r]}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span className="text-[11px] font-mono px-2.5 py-1 rounded bg-[#161D26] text-[#94A3B8] border border-[#1F2D3D]">
                        {ROLE_LABELS[m.role] || m.role}
                      </span>
                    )}

                    {canManage && !isCurrentUser && (
                      <button
                        onClick={() => setRemoveTarget(m)}
                        title={m.status === "PENDING" ? "Cancel invite" : "Remove from team"}
                        className="p-1.5 rounded-lg text-[#64748B] hover:text-[#EF4444] hover:bg-[#EF4444]/10 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {toast.message && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#161D26] border border-[#1F2D3D] text-[#F1F5F9] px-4 py-3 rounded-xl shadow-2xl text-xs font-semibold animate-in fade-in">
          {toast.message}
        </div>
      )}

      <ConfirmModal
        isOpen={Boolean(removeTarget)}
        title={removeTarget?.status === "PENDING" ? "Cancel Invite" : "Remove Team Member"}
        description={
          removeTarget?.status === "PENDING"
            ? `Cancel the pending invite for ${removeTarget?.email}?`
            : `Remove ${removeTarget?.name || removeTarget?.email} from this workspace? They will lose access immediately.`
        }
        confirmLabel={removeTarget?.status === "PENDING" ? "Cancel Invite" : "Remove Member"}
        cancelLabel="Keep"
        variant="danger"
        isLoading={isRemoving}
        onConfirm={handleRemove}
        onClose={() => setRemoveTarget(null)}
      />
    </div>
  );
}

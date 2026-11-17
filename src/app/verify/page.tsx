"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { PhoneShell } from "@/components/layout/PhoneShell";
import { BrandMark } from "@/components/ui/BrandMark";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { useApp } from "@/lib/app-context";
import {
  DARAKBANGS,
  findRosterMember,
  getSunsForDarakbang,
  isNewFamilySun,
  isUnassignedSun,
  roleFromRosterMember,
  sunNameToGroupId,
  usesFreeTextLegalName,
} from "@/lib/community/darakbang-roster";

type Step = "darakbang" | "sun" | "name";

const selectClassName =
  "verify-field w-full rounded-[var(--radius-sm)] bg-[color-mix(in_srgb,var(--color-mint)_35%,white)] px-3 py-3 type-body font-semibold text-text-main outline-none focus:ring-2 focus:ring-[color-mix(in_srgb,var(--color-sky)_55%,transparent)]";

const fieldClassName =
  "w-full rounded-[var(--radius-sm)] bg-[color-mix(in_srgb,var(--color-mint)_35%,white)] px-3 py-3 type-body font-semibold text-text-main outline-none focus:ring-2 focus:ring-[color-mix(in_srgb,var(--color-sky)_55%,transparent)]";

export default function CommunityVerifyPage() {
  const router = useRouter();
  const {
    ready,
    currentUser,
    communityStatus,
    applyRosterVerification,
    submitVerificationException,
    logout,
  } = useApp();

  const [step, setStep] = useState<Step>("darakbang");
  const [darakbangId, setDarakbangId] = useState<string>("");
  const [sunName, setSunName] = useState<string>("");
  const [legalName, setLegalName] = useState("");
  const [exceptionNote, setExceptionNote] = useState("");
  const [showException, setShowException] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!ready) return;
    if (!currentUser) {
      router.replace("/login");
      return;
    }
    if (communityStatus === "verified") {
      router.replace("/home");
    }
  }, [ready, currentUser, communityStatus, router]);

  const suns = useMemo(
    () => (darakbangId ? getSunsForDarakbang(darakbangId) : []),
    [darakbangId],
  );

  const selectedDarakbang = DARAKBANGS.find((d) => d.id === darakbangId);
  const selectedSun = suns.find((s) => s.groupName === sunName);
  const memberNames = selectedSun?.members.map((m) => m.name) ?? [];
  const freeTextName = Boolean(sunName && usesFreeTextLegalName(sunName));
  const unassigned = Boolean(sunName && isUnassignedSun(sunName));
  const newFamily = Boolean(sunName && isNewFamilySun(sunName));

  // 미배정: open exception path once 순 is chosen.
  useEffect(() => {
    if (step === "name" && unassigned) {
      setShowException(true);
    }
  }, [step, unassigned]);

  const onConfirmName = async () => {
    setError(null);
    const name = legalName.trim();
    if (!sunName) {
      setError("순을 먼저 선택해 주세요.");
      return;
    }
    if (!name) {
      setError(freeTextName ? "본명을 입력해 주세요." : "본명을 선택해 주세요.");
      return;
    }

    // 새가족: free-text → verified member, no 순 yet.
    if (newFamily) {
      setBusy(true);
      const res = await applyRosterVerification({
        legalName: name,
        groupId: null,
        role: "member",
      });
      setBusy(false);
      if (!res.ok) {
        setError(res.message);
        return;
      }
      router.replace("/home");
      return;
    }

    const member = findRosterMember(sunName, name);
    if (!member) {
      setError(
        "명단에서 본명을 찾지 못했어요. 아래 예외 신청을 이용해 주세요.",
      );
      setShowException(true);
      return;
    }
    const groupId = sunNameToGroupId(sunName);
    if (!groupId) {
      setError("순 정보를 찾지 못했어요. 관리자에게 문의해 주세요.");
      return;
    }
    setBusy(true);
    const res = await applyRosterVerification({
      legalName: name,
      groupId,
      role: roleFromRosterMember(member),
    });
    setBusy(false);
    if (!res.ok) {
      setError(res.message);
      return;
    }
    router.replace("/home");
  };

  const onException = async () => {
    setError(null);
    if (!legalName.trim()) {
      setError("예외 신청에도 본명을 적어 주세요.");
      return;
    }
    setBusy(true);
    const res = await submitVerificationException(
      legalName,
      exceptionNote ||
        [selectedDarakbang?.name, sunName].filter(Boolean).join(" · "),
    );
    setBusy(false);
    if (!res.ok) {
      setError(res.message);
      return;
    }
    setError(null);
    alert(
      "확인 요청을 남겼어요. 관리자 승인 전까지 앱 이용이 제한될 수 있어요.",
    );
  };

  if (!ready || !currentUser) {
    return (
      <PhoneShell>
        <div className="flex min-h-[100dvh] items-center justify-center bg-white">
          <BrandMark size={56} className="animate-soft-pulse" />
        </div>
      </PhoneShell>
    );
  }

  return (
    <PhoneShell>
      <div className="relative flex min-h-[100dvh] flex-col bg-white px-6 pb-10 pt-[calc(2.5rem+var(--safe-top))]">
        <div className="mb-6 text-center">
          <BrandMark size={56} className="mx-auto mb-4" />
          <h1 className="type-display-xl text-text-main">공동체 확인</h1>
          <p className="type-body-lg mt-2 text-text-main">
            다락방 → 순 → 본명 순으로
            <br />
            드림 명단과 맞춰 주세요.
          </p>
          {communityStatus === "exception" ? (
            <p className="mt-3 type-caption font-semibold text-[var(--color-ink-blue)]">
              예외 확인 요청이 접수된 상태예요.
            </p>
          ) : null}
        </div>

        <div className="soft-card flex-1 space-y-5 p-[var(--space-card)]">
          {/* Step 1: 다락방 */}
          <div>
            <p className="qt-field-title mb-2">1. 다락방</p>
            <div className="grid grid-cols-2 gap-2">
              {DARAKBANGS.map((d) => {
                const active = darakbangId === d.id;
                return (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => {
                      setDarakbangId(d.id);
                      setSunName("");
                      setLegalName("");
                      setShowException(false);
                      setStep("sun");
                      setError(null);
                    }}
                    className={`rounded-[var(--radius-sm)] px-3 py-3 text-left type-body font-semibold transition-colors ${
                      active
                        ? "bg-[var(--cta)] text-white"
                        : "bg-[color-mix(in_srgb,var(--color-mint)_35%,white)] text-text-main"
                    }`}
                  >
                    {d.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 2: 순 */}
          {step !== "darakbang" && darakbangId ? (
            <div>
              <p className="qt-field-title mb-2">2. 순</p>
              <select
                value={sunName}
                onChange={(e) => {
                  setSunName(e.target.value);
                  setLegalName("");
                  setShowException(false);
                  setStep("name");
                  setError(null);
                }}
                className={selectClassName}
              >
                <option value="">순을 선택하세요</option>
                {suns.map((s) => (
                  <option key={s.groupName} value={s.groupName}>
                    {s.groupName}
                  </option>
                ))}
              </select>
            </div>
          ) : null}

          {/* Step 3: 본명 — dropdown when roster has members; free-text for 미배정/새가족 */}
          {step === "name" && sunName ? (
            <div>
              <p className="qt-field-title mb-2">3. 본명</p>
              {freeTextName ? (
                <>
                  <input
                    type="text"
                    value={legalName}
                    maxLength={40}
                    autoComplete="name"
                    placeholder="본명을 입력해 주세요"
                    onChange={(e) => setLegalName(e.target.value)}
                    className={fieldClassName}
                  />
                  {unassigned ? (
                    <p className="mt-2 type-caption text-text-secondary">
                      미배정은 명단이 없어요. 본명을 적고 예외 신청해 주세요.
                    </p>
                  ) : null}
                  {newFamily ? (
                    <p className="mt-2 type-caption text-text-secondary">
                      새가족은 본명을 직접 입력해 주세요.
                    </p>
                  ) : null}
                </>
              ) : (
                <select
                  value={legalName}
                  onChange={(e) => {
                    setLegalName(e.target.value);
                    setError(null);
                  }}
                  className={selectClassName}
                >
                  <option value="">본명을 선택하세요</option>
                  {memberNames.map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                </select>
              )}
              <p className="mt-2 type-caption text-text-secondary">
                본인 인증 후에 별명을 재설정 할 수 있어요
              </p>
              {!unassigned ? (
                <PrimaryButton
                  type="button"
                  className="mt-3 w-full"
                  disabled={busy || !legalName.trim()}
                  onClick={() => void onConfirmName()}
                >
                  {busy ? "확인 중…" : "명단과 맞추기"}
                </PrimaryButton>
              ) : null}
            </div>
          ) : null}

          {error ? (
            <p className="type-caption font-semibold text-red-600">{error}</p>
          ) : null}

          {showException ? (
            <div className="space-y-2 border-t border-[var(--color-divider,#e5eaf0)] pt-4">
              <p className="qt-field-title">명단에 없나요? 예외 신청</p>
              <textarea
                value={exceptionNote}
                onChange={(e) => setExceptionNote(e.target.value)}
                rows={3}
                placeholder="소속·상황 메모 (선택)"
                className="w-full rounded-[var(--radius-sm)] bg-[color-mix(in_srgb,var(--color-mint)_35%,white)] px-3 py-3 type-body text-text-main outline-none focus:ring-2 focus:ring-[color-mix(in_srgb,var(--color-sky)_55%,transparent)]"
              />
              <PrimaryButton
                type="button"
                variant="secondary"
                className="w-full"
                disabled={busy || !legalName.trim()}
                onClick={() => void onException()}
              >
                관리자 확인 요청
              </PrimaryButton>
            </div>
          ) : null}
        </div>

        <button
          type="button"
          className="mt-6 type-caption text-text-secondary underline-offset-2 hover:underline"
          onClick={() => {
            void logout();
            router.replace("/login");
          }}
        >
          다른 계정으로 로그인
        </button>
      </div>
    </PhoneShell>
  );
}

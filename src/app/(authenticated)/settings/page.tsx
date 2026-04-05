"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  User as UserIcon,
  Mail,
  Shield,
  Building2,
  Save,
  Loader2,
  Briefcase,
  Compass,
  TrendingUp,
  Award,
  Check,
  Target,
  CheckCircle2,
  Clock,
  LogOut,
} from "lucide-react";
import { toast } from "sonner";
import { useCurrentUser, useCareerProgress, useRequirementCompletions } from "@/lib/queries";
import { useQueryClient } from "@tanstack/react-query";
import { Tabs } from "@/components/ui/Tabs";
import { CareerLadder } from "@/components/career/CareerLadder";
import { ProgressBar } from "@/components/ui/ProgressBar";
import {
  CAREER_PATHS,
  getCareerPath,
  getNextLevel,
} from "@/lib/career-paths";

type SettingsTab = "profil" | "karriere" | "konto";

const SETTINGS_TABS: { key: SettingsTab; label: string }[] = [
  { key: "profil", label: "Profil" },
  { key: "karriere", label: "Karriere" },
  { key: "konto", label: "Konto" },
];

const roleLabels: Record<string, string> = {
  super_admin: "Super Admin",
  admin: "Administrator",
  hr: "HR",
  manager: "Manager",
  employee: "Mitarbeiter",
};

function SettingsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tabParam = searchParams.get("tab") as SettingsTab | null;
  const activeTab: SettingsTab = ["profil", "karriere", "konto"].includes(tabParam!) ? tabParam! : "profil";

  const handleTabChange = (tab: SettingsTab) => {
    router.replace(`/settings?tab=${tab}`, { scroll: false });
  };

  const { data: userData, isLoading: isLoadingUser } = useCurrentUser();
  const queryClient = useQueryClient();
  const user = userData?.user;

  // Profile form state
  const [name, setName] = useState("");
  const [department, setDepartment] = useState("");
  const [position, setPosition] = useState("");
  const [craftFocus, setCraftFocus] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [hasInitialized, setHasInitialized] = useState(false);

  // Career data
  const { data: careerData, isLoading: isLoadingCareer } = useCareerProgress();
  const { data: completionsData } = useRequirementCompletions();

  const progress = careerData?.progress ?? null;
  const completions = completionsData?.completions ?? [];

  // Initialize form with user data once loaded
  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setDepartment(user.department || "");
      setPosition(user.position || "");
      setCraftFocus(user.craft_focus || "");
      setHasInitialized(true);
    }
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setIsSaving(true);

    try {
      const res = await fetch("/api/auth/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, department, position, craft_focus: craftFocus }),
      });

      if (res.ok) {
        toast.success("Profil aktualisiert");
        queryClient.invalidateQueries({ queryKey: ["currentUser"] });
      } else {
        toast.error("Fehler beim Speichern");
      }
    } catch {
      toast.error("Fehler beim Speichern");
    } finally {
      setIsSaving(false);
    }
  };

  const hasChanges = user && (
    name !== user.name ||
    department !== (user.department || "") ||
    position !== (user.position || "") ||
    craftFocus !== (user.craft_focus || "")
  );

  // Career path calculations
  const userPathId = user?.craft_focus || CAREER_PATHS[0].id;
  const selectedPath = getCareerPath(userPathId) || CAREER_PATHS[0];
  const currentLevelId = progress?.current_level_id || "junior";
  const currentLevel = selectedPath.levels.find((l) => l.id === currentLevelId);
  const nextLevel = getNextLevel(selectedPath.id, currentLevelId);

  const nextLevelTotalItems = nextLevel
    ? nextLevel.requirements.length +
      nextLevel.aiIntegration.length +
      (nextLevel.skills?.length ?? 0) +
      nextLevel.responsibilities.length
    : 0;
  const qualifyingOkrs = progress?.qualifying_okr_count ?? 1;
  const requiredOkrs = 4;
  const fulfilledItems = nextLevel
    ? completions.filter(
        (c) =>
          c.career_path_id === selectedPath.id &&
          c.level_id === nextLevel.id &&
          c.status === "completed"
      ).length
    : 0;
  const openItems = nextLevelTotalItems - fulfilledItems;
  const progressPercent =
    nextLevelTotalItems > 0
      ? Math.round((fulfilledItems / nextLevelTotalItems) * 100)
      : 0;

  if (isLoadingUser) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="border-b border-cream-300/50">
        <div className="h-14 flex items-center px-6 max-w-[1400px] mx-auto">
          <h1 className="text-[15px] font-semibold text-foreground">
            Profil &amp; Einstellungen
          </h1>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="p-6 max-w-[1400px] mx-auto">
          {/* Tabs */}
          <div className="mb-6">
            <Tabs<SettingsTab>
              tabs={SETTINGS_TABS}
              activeTab={activeTab}
              onTabChange={handleTabChange}
              variant="underline"
              ariaLabel="Einstellungen Navigation"
            />
          </div>

          {/* Tab: Profil */}
          {activeTab === "profil" && (
            <div className="card p-6">
              {/* Avatar + Info */}
              <div className="flex items-center gap-4 mb-8 p-4 bg-cream-50 rounded-xl">
                {user.avatar_url ? (
                  <img
                    src={user.avatar_url}
                    alt={user.name}
                    className="w-20 h-20 rounded-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-cream-300 flex items-center justify-center">
                    <span className="text-xl font-medium text-foreground">
                      {user.name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)}
                    </span>
                  </div>
                )}
                <div>
                  <p className="font-semibold text-foreground">{user.name}</p>
                  <p className="text-sm text-muted">{user.email}</p>
                  <span className="badge badge-blue text-[11px] mt-1 inline-block">
                    {roleLabels[user.role] || user.role}
                  </span>
                </div>
              </div>

              {/* Two-column form */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left column */}
                <div className="space-y-5">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-foreground mb-1.5">
                      <div className="flex items-center gap-1.5">
                        <UserIcon className="h-3.5 w-3.5 text-muted" />
                        Name
                      </div>
                    </label>
                    <input
                      id="name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="input w-full"
                      placeholder="Dein Name"
                    />
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-foreground mb-1.5">
                      <div className="flex items-center gap-1.5">
                        <Mail className="h-3.5 w-3.5 text-muted" />
                        E-Mail
                      </div>
                    </label>
                    <input
                      id="email"
                      type="email"
                      value={user.email}
                      disabled
                      className="input w-full opacity-60 cursor-not-allowed"
                    />
                    <p className="text-[11px] text-muted mt-1">
                      E-Mail wird durch Google OAuth verwaltet
                    </p>
                  </div>

                  <div>
                    <label htmlFor="department" className="block text-sm font-medium text-foreground mb-1.5">
                      <div className="flex items-center gap-1.5">
                        <Building2 className="h-3.5 w-3.5 text-muted" />
                        Abteilung
                      </div>
                    </label>
                    <input
                      id="department"
                      type="text"
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      className="input w-full"
                      placeholder="z.B. Performance Marketing"
                    />
                  </div>

                  <div>
                    <label htmlFor="position" className="block text-sm font-medium text-foreground mb-1.5">
                      <div className="flex items-center gap-1.5">
                        <Briefcase className="h-3.5 w-3.5 text-muted" />
                        Position
                      </div>
                    </label>
                    <input
                      id="position"
                      type="text"
                      value={position}
                      onChange={(e) => setPosition(e.target.value)}
                      className="input w-full"
                      placeholder="z.B. Performance Marketing Manager"
                    />
                  </div>
                </div>

                {/* Right column */}
                <div className="space-y-5">
                  <div>
                    <label htmlFor="craft-focus" className="block text-sm font-medium text-foreground mb-1.5">
                      <div className="flex items-center gap-1.5">
                        <Compass className="h-3.5 w-3.5 text-muted" />
                        Craft Focus
                      </div>
                    </label>
                    <select
                      id="craft-focus"
                      value={craftFocus}
                      onChange={(e) => setCraftFocus(e.target.value)}
                      className="input w-full"
                    >
                      <option value="">Bitte wahlen...</option>
                      <option value="design">Design</option>
                      <option value="development">Development</option>
                      <option value="marketing">Marketing</option>
                      <option value="sales">Sales</option>
                      <option value="operations">Operations</option>
                      <option value="hr">HR</option>
                      <option value="finance">Finance</option>
                      <option value="other">Sonstiges</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">
                      <div className="flex items-center gap-1.5">
                        <Shield className="h-3.5 w-3.5 text-muted" />
                        Rolle
                      </div>
                    </label>
                    <input
                      type="text"
                      value={roleLabels[user.role] || user.role}
                      disabled
                      className="input w-full opacity-60 cursor-not-allowed"
                    />
                    <p className="text-[11px] text-muted mt-1">
                      Rollen werden von Administratoren verwaltet
                    </p>
                  </div>
                </div>
              </div>

              {/* Save Button */}
              <div className="mt-8 flex justify-end">
                <button
                  onClick={handleSave}
                  disabled={!hasChanges || isSaving}
                  className="btn-primary text-[13px] gap-1.5"
                >
                  {isSaving ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Save className="h-3.5 w-3.5" />
                  )}
                  Speichern
                </button>
              </div>
            </div>
          )}

          {/* Tab: Karriere */}
          {activeTab === "karriere" && (
            <div className="space-y-6">
              {/* Level Overview — Two columns */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Bestaetigtes Level */}
                <div className="card p-5">
                  <p className="text-[10px] font-semibold text-muted uppercase tracking-wider mb-3">
                    Bestätigtes Level
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-cream-200 flex items-center justify-center">
                      <Award className="h-5 w-5 text-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[15px] font-semibold text-foreground">
                        {currentLevel?.name ?? "Nicht festgelegt"}{" "}
                        {selectedPath.shortName}
                      </p>
                      <p className="text-[11px] text-muted">
                        {selectedPath.shortName}
                        {user?.department ? ` · ${user.department}` : ""}
                      </p>
                    </div>
                    {currentLevel && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-cream-200 text-foreground text-[11px] font-semibold">
                        <Check className="h-3 w-3" />
                        {currentLevel.id.charAt(0).toUpperCase() +
                          currentLevel.id.slice(1)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Naechster Schritt */}
                <div className="card p-5">
                  <p className="text-[10px] font-semibold text-muted uppercase tracking-wider mb-3">
                    Nächster Schritt
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-cream-200 flex items-center justify-center">
                      <TrendingUp className="h-5 w-5 text-muted" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[15px] font-semibold text-foreground">
                        {nextLevel?.name ?? "Höchste Stufe erreicht"}{" "}
                        {nextLevel ? selectedPath.shortName : ""}
                      </p>
                      {nextLevel && (
                        <p className="text-[11px] text-muted">
                          {nextLevel.requirements.length +
                            nextLevel.aiIntegration.length +
                            (nextLevel.skills?.length ?? 0) +
                            nextLevel.responsibilities.length}{" "}
                          Kriterien · {nextLevel.experience}
                        </p>
                      )}
                    </div>
                    {nextLevel && (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-cream-200 text-foreground text-[11px] font-semibold">
                        {nextLevel.id.charAt(0).toUpperCase() +
                          nextLevel.id.slice(1)}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Progress to next level */}
              <div className="card p-5">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-[13px] font-semibold text-foreground">
                    Fortschritt zum nächsten Level
                  </h2>
                  <span className="text-[13px] font-semibold text-foreground">
                    {progressPercent}%
                  </span>
                </div>
                <ProgressBar value={progressPercent} size="md" />

                <p className="text-[12px] text-muted mt-3">
                  {fulfilledItems} von {nextLevelTotalItems} Kriterien erfüllt ·{" "}
                  {openItems} noch offen
                </p>

                {/* OKR qualification */}
                <div className="mt-4 pt-4 border-t border-cream-200/60">
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="h-3.5 w-3.5 text-muted" />
                    <span className="text-[12px] text-muted">
                      {qualifyingOkrs} von {requiredOkrs} OKRs mit Score ≥ 0.7
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {Array.from({ length: requiredOkrs }).map((_, i) => (
                      <div
                        key={i}
                        className={`flex-1 h-7 rounded-md flex items-center justify-center text-[10px] font-medium ${
                          i < qualifyingOkrs
                            ? "bg-foreground text-white"
                            : "bg-cream-200 text-muted"
                        }`}
                      >
                        {i < qualifyingOkrs ? (
                          <CheckCircle2 className="h-3.5 w-3.5" />
                        ) : (
                          <Clock className="h-3.5 w-3.5" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Career Path Ladder */}
              <div>
                <p className="text-[10px] font-semibold text-muted uppercase tracking-wider mb-3">
                  Karrierepfad
                </p>
                <CareerLadder
                  levels={selectedPath.levels}
                  currentLevelId={currentLevelId}
                  pathId={selectedPath.id}
                  pathName={selectedPath.shortName}
                />
              </div>

              {/* Link to Profil tab */}
              <div className="text-center">
                <button
                  onClick={() => handleTabChange("profil")}
                  className="text-[13px] text-muted hover:text-foreground transition-colors underline underline-offset-2"
                >
                  Craft Focus anpassen
                </button>
              </div>
            </div>
          )}

          {/* Tab: Konto */}
          {activeTab === "konto" && (
            <div className="card p-6">
              <h2 className="text-sm font-semibold text-foreground mb-4">Account</h2>
              <div className="space-y-3 text-[13px]">
                <div className="flex justify-between">
                  <span className="text-muted">E-Mail</span>
                  <span className="text-foreground">{user.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Anmeldung via</span>
                  <span className="text-foreground">Google OAuth</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Erstellt am</span>
                  <span className="text-foreground">
                    {new Date(user.created_at).toLocaleDateString("de-DE", {
                      day: "2-digit",
                      month: "long",
                      year: "numeric",
                    })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Account-Status</span>
                  <span className="badge badge-green text-[11px]">Aktiv</span>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-cream-200/60">
                <form action="/auth/signout" method="POST">
                  <button
                    type="submit"
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-[13px] font-medium rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    Abmelden
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense
      fallback={
        <div className="h-full flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted" />
        </div>
      }
    >
      <SettingsContent />
    </Suspense>
  );
}

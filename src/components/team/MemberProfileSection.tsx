"use client";

import { useState, useEffect } from "react";
import { User, Briefcase, Award, Building2, Save, Loader2 } from "lucide-react";
import { CAREER_PATHS, getCareerPath } from "@/lib/career-paths";
import { useUpdateTeamMember } from "@/lib/queries";
import { toast } from "sonner";
import type { CareerLevel } from "@/types";

interface MemberProfileSectionProps {
  memberId: string;
  position: string | null;
  craftFocus: string | null;
  careerLevelId: string | null;
  department: string | null;
  careerLevel: CareerLevel | null;
  canEdit: boolean;
}

export function MemberProfileSection({
  memberId,
  position,
  craftFocus,
  careerLevelId,
  department,
  careerLevel,
  canEdit,
}: MemberProfileSectionProps) {
  const [editPosition, setEditPosition] = useState(position || "");
  const [editCraftFocus, setEditCraftFocus] = useState(craftFocus || "");
  const [editCareerLevelId, setEditCareerLevelId] = useState(careerLevelId || "");
  const [editDepartment, setEditDepartment] = useState(department || "");
  const [isDirty, setIsDirty] = useState(false);

  const updateMember = useUpdateTeamMember();

  // Reset form when props change
  useEffect(() => {
    setEditPosition(position || "");
    setEditCraftFocus(craftFocus || "");
    setEditCareerLevelId(careerLevelId || "");
    setEditDepartment(department || "");
    setIsDirty(false);
  }, [position, craftFocus, careerLevelId, department]);

  // Get levels for selected career path
  const selectedPath = editCraftFocus ? getCareerPath(editCraftFocus) : null;
  const pathLevels = selectedPath?.levels || [];

  const handleChange = () => setIsDirty(true);

  const handleSave = async () => {
    try {
      const data: Record<string, unknown> = { memberId };
      if (editPosition !== (position || "")) data.position = editPosition || "";
      if (editCraftFocus !== (craftFocus || "")) data.craft_focus = editCraftFocus || "";
      if (editCareerLevelId !== (careerLevelId || "")) {
        data.career_level_id = editCareerLevelId || null;
      }
      if (editDepartment !== (department || "")) data.department = editDepartment || "";

      await updateMember.mutateAsync(data as {
        memberId: string;
        position?: string;
        craft_focus?: string;
        career_level_id?: string | null;
        department?: string;
      });

      toast.success("Profil aktualisiert");
      setIsDirty(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Fehler beim Speichern");
    }
  };

  if (!canEdit) {
    // Read-only view
    return (
      <div className="space-y-2.5">
        <h4 className="text-[11px] font-semibold text-muted uppercase tracking-wider flex items-center gap-1.5">
          <User className="h-3.5 w-3.5" />
          Profil & Karriere
        </h4>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-[10px] text-muted uppercase tracking-wider mb-0.5">Position</p>
            <p className="text-[13px] text-foreground">{position || "—"}</p>
          </div>
          <div>
            <p className="text-[10px] text-muted uppercase tracking-wider mb-0.5">Abteilung</p>
            <p className="text-[13px] text-foreground">{department || "—"}</p>
          </div>
          <div>
            <p className="text-[10px] text-muted uppercase tracking-wider mb-0.5">Karrierepfad</p>
            <p className="text-[13px] text-foreground">
              {craftFocus ? (getCareerPath(craftFocus)?.name || craftFocus) : "—"}
            </p>
          </div>
          <div>
            <p className="text-[10px] text-muted uppercase tracking-wider mb-0.5">Karrierestufe</p>
            <p className="text-[13px] text-foreground">{careerLevel?.name || "—"}</p>
          </div>
        </div>
      </div>
    );
  }

  // Editable view
  return (
    <div className="space-y-2.5">
      <h4 className="text-[11px] font-semibold text-muted uppercase tracking-wider flex items-center gap-1.5">
        <User className="h-3.5 w-3.5" />
        Profil & Karriere
      </h4>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Position / Title */}
        <div>
          <label className="text-[10px] text-muted uppercase tracking-wider mb-0.5 flex items-center gap-1">
            <Briefcase className="h-3 w-3" />
            Position / Titel
          </label>
          <input
            type="text"
            value={editPosition}
            onChange={(e) => { setEditPosition(e.target.value); handleChange(); }}
            placeholder="z.B. Junior Branddesigner"
            className="input text-[13px]"
          />
        </div>

        {/* Department */}
        <div>
          <label className="text-[10px] text-muted uppercase tracking-wider mb-0.5 flex items-center gap-1">
            <Building2 className="h-3 w-3" />
            Abteilung
          </label>
          <input
            type="text"
            value={editDepartment}
            onChange={(e) => { setEditDepartment(e.target.value); handleChange(); }}
            placeholder="z.B. Design"
            className="input text-[13px]"
          />
        </div>

        {/* Career Path */}
        <div>
          <label className="text-[10px] text-muted uppercase tracking-wider mb-0.5 flex items-center gap-1">
            <Award className="h-3 w-3" />
            Karrierepfad
          </label>
          <select
            value={editCraftFocus}
            onChange={(e) => {
              setEditCraftFocus(e.target.value);
              // Reset career level when path changes
              setEditCareerLevelId("");
              handleChange();
            }}
            className="input text-[13px]"
          >
            <option value="">Kein Pfad zugewiesen</option>
            {CAREER_PATHS.map((path) => (
              <option key={path.id} value={path.id}>
                {path.name}
              </option>
            ))}
          </select>
        </div>

        {/* Career Level */}
        <div>
          <label className="text-[10px] text-muted uppercase tracking-wider mb-0.5 flex items-center gap-1">
            <Award className="h-3 w-3" />
            Karrierestufe
          </label>
          <select
            value={editCareerLevelId}
            onChange={(e) => { setEditCareerLevelId(e.target.value); handleChange(); }}
            className="input text-[13px]"
            disabled={!editCraftFocus}
          >
            <option value="">Keine Stufe</option>
            {pathLevels.map((level) => (
              <option key={level.id} value={level.id}>
                {level.name} ({level.experience})
              </option>
            ))}
          </select>
          {!editCraftFocus && (
            <p className="text-[10px] text-muted mt-0.5">Erst einen Karrierepfad wählen</p>
          )}
        </div>
      </div>

      {/* Save button */}
      {isDirty && (
        <button
          onClick={handleSave}
          disabled={updateMember.isPending}
          className="btn-primary text-[12px] gap-1.5 mt-1"
        >
          {updateMember.isPending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Save className="h-3.5 w-3.5" />
          )}
          Speichern
        </button>
      )}
    </div>
  );
}

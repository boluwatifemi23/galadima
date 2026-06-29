"use client";

import { useEffect, useState } from "react";
import { useDepartments } from "@/lib/hooks/useDepartments";

interface RecipientPickerValue {
  department: string;
  employeeId: string;
}

interface StaffOption {
  _id: string;
  name: string;
}

export default function RecipientPicker({
  value,
  onChange,
  lockDepartment,
  roleFilter,
}: {
  value: RecipientPickerValue;
  onChange: (value: RecipientPickerValue) => void;
  lockDepartment?: string;
  roleFilter?: string;
}) {
  const { departments } = useDepartments();
  const [staff, setStaff] = useState<StaffOption[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function fetchStaff() {
      const dept = lockDepartment || value.department;
      if (!dept) {
        if (!cancelled) setStaff([]);
        return;
      }
      const params = new URLSearchParams({ department: dept });
      if (roleFilter) params.set("role", roleFilter);
      const res = await fetch(`/api/users?${params.toString()}`);
      const json = await res.json();
      if (!cancelled && json.success) setStaff(json.users);
    }

    fetchStaff();
    return () => { cancelled = true; };
  }, [lockDepartment, value.department, roleFilter]);

  return (
    <>
      <div className="form-group">
        <label className="form-label">Department</label>
        <select
          title="Select the department to send the broadcast to"
          className="form-select"
          value={lockDepartment || value.department}
          disabled={!!lockDepartment}
          onChange={(e) => onChange({ department: e.target.value, employeeId: "" })}
        >
          <option value="">{lockDepartment || "Everyone"}</option>
          {departments.map((d) => <option key={d} value={d}>{d}</option>)}
        </select>
      </div>
      {(lockDepartment || value.department) && (
        <div className="form-group">
          <label className="form-label">Specific Person (optional)</label>
          <select
            title="Select a specific employee to send the broadcast to"
            className="form-select"
            value={value.employeeId}
            onChange={(e) => onChange({ department: value.department, employeeId: e.target.value })}
          >
            <option value="">Everyone in this department</option>
            {staff.map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}
          </select>
        </div>
      )}
    </>
  );
}
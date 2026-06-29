"use client";

import { useEffect, useState } from "react";

interface Department {
  name: string;
  isActive: boolean;
}

export function useDepartments() {
  const [departments, setDepartments] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/departments")
      .then((res) => res.json())
      .then((json) => {
        if (json.success)
          setDepartments(
            json.departments
              .filter((d: Department) => d.isActive)
              .map((d: Department) => d.name)
          );
      })
      .finally(() => setLoading(false));
  }, []);

  return { departments, loading };
}
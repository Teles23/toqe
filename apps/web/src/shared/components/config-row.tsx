/* eslint-disable no-restricted-syntax */
"use client";

import React from "react";

interface ConfigRowProps {
  label: string;
  desc?: string;
  children: React.ReactNode;
  noBorder?: boolean;
}

export function ConfigRow({ label, desc, children, noBorder }: ConfigRowProps) {
  return (
    <div
      className="flex items-center justify-between py-3.5 gap-4"
      style={noBorder ? {} : { borderBottom: "1px solid var(--border-subtle)" }}
    >
      <div className="flex-1 min-w-0">
        <span
          className="block text-[13px] font-medium"
          style={{ color: "var(--text-primary)" }}
        >
          {label}
        </span>
        {desc && (
          <span
            className="block text-[11px] mt-0.5"
            style={{ color: "var(--text-secondary)" }}
          >
            {desc}
          </span>
        )}
      </div>
      <div className="flex-shrink-0">{children}</div>
    </div>
  );
}

import Link from "next/link";
import type React from "react";

import { Badge, Container } from "@/components/ui";
import type {
  AdminPermission,
  AdminWorkspaceRole,
} from "@/lib/auth/admin";
import type { Language } from "@/lib/i18n/language";

import {
  AdminOperationsNavigation,
  type AdminNavigationKey,
} from "./admin-navigation";

type ShellMetric = {
  label: string;
  value: string;
};

const shellCopy = {
  en: {
    backToStorefront: "Storefront",
    signedInAs: (name: string) => `Signed in as ${name}`,
    roleLabel: "Workspace role",
    roleNames: {
      admin: "Admin",
      staff: "Staff",
    },
  },
  vi: {
    backToStorefront: "Cửa hàng",
    signedInAs: (name: string) => `Đã đăng nhập: ${name}`,
    roleLabel: "Vai trò",
    roleNames: {
      admin: "Admin",
      staff: "Staff",
    },
  },
} as const;

export function AdminShellPage({
  active,
  badge,
  children,
  description,
  language,
  metrics = [],
  permissions,
  role,
  title,
  userName,
}: {
  active: AdminNavigationKey;
  badge: string;
  children?: React.ReactNode;
  description: string;
  language: Language;
  metrics?: readonly ShellMetric[];
  permissions: AdminPermission[];
  role: AdminWorkspaceRole;
  title: string;
  userName: string;
}) {
  const copy = shellCopy[language];

  return (
    <main
      className="bg-background py-case-2xl text-foreground"
      data-admin-shell-page={active}
      data-admin-workspace-role={role}
    >
      <Container className="flex flex-col gap-case-lg">
        <div className="flex flex-col gap-case-md lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <p className="text-small font-medium text-text-muted">
              {copy.signedInAs(userName)}
            </p>
            <div className="mt-case-md flex flex-wrap gap-case-sm">
              <Badge variant="primary">{badge}</Badge>
              <Badge variant="neutral" data-admin-role-badge={role}>
                {copy.roleLabel}: {copy.roleNames[role]}
              </Badge>
            </div>
            <h1 className="mt-case-sm text-heading-2 font-semibold text-foreground sm:text-heading-1">
              {title}
            </h1>
            <p className="mt-case-sm max-w-3xl text-body leading-7 text-text-muted">
              {description}
            </p>
          </div>
          <Link
            href="/"
            className="inline-flex min-h-11 w-fit items-center justify-center rounded-md border border-border bg-surface px-4 py-2 text-body font-medium text-foreground transition-colors hover:border-primary hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            {copy.backToStorefront}
          </Link>
        </div>

        <AdminOperationsNavigation
          active={active}
          language={language}
          permissions={permissions}
          role={role}
        />

        {metrics.length > 0 ? (
          <dl className="grid gap-case-sm sm:grid-cols-2 lg:grid-cols-4">
            {metrics.map((metric) => (
              <div
                key={metric.label}
                className="rounded-md border border-border bg-surface p-case-md"
              >
                <dt className="text-small text-text-muted">{metric.label}</dt>
                <dd className="mt-case-xs text-heading-3 font-semibold text-foreground">
                  {metric.value}
                </dd>
              </div>
            ))}
          </dl>
        ) : null}

        {children}
      </Container>
    </main>
  );
}

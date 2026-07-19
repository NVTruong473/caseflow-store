import fs from "node:fs";
import path from "node:path";

type HeaderExpectation = {
  header: string;
  includes?: string[];
  exact?: string;
  absent?: boolean;
};

type RouteCheck = {
  expectations: HeaderExpectation[];
  label: string;
  path: string;
};

const ARTIFACT_DIR = path.join(
  ".agent",
  "artifacts",
  process.env.SECURITY_QA_ARTIFACT_ID ?? "secqa-t01",
);

const BASE_URL = parseBaseURL(
  process.env.SECURITY_QA_BASE_URL ??
    process.env.PLAYWRIGHT_BASE_URL ??
    "http://127.0.0.1:3000",
);

const globalExpectations: HeaderExpectation[] = [
  {
    exact: "DENY",
    header: "x-frame-options",
  },
  {
    exact: "nosniff",
    header: "x-content-type-options",
  },
  {
    exact: "strict-origin-when-cross-origin",
    header: "referrer-policy",
  },
  {
    exact: "same-origin",
    header: "cross-origin-opener-policy",
  },
  {
    exact: "same-origin",
    header: "cross-origin-resource-policy",
  },
  {
    exact: "none",
    header: "x-permitted-cross-domain-policies",
  },
  {
    exact: "0",
    header: "x-xss-protection",
  },
  {
    header: "strict-transport-security",
    includes: ["max-age=63072000", "includeSubDomains", "preload"],
  },
  {
    header: "permissions-policy",
    includes: [
      "camera=()",
      "microphone=()",
      "geolocation=()",
      "payment=()",
      "usb=()",
      "browsing-topics=()",
    ],
  },
  {
    header: "content-security-policy",
    includes: [
      "default-src 'self'",
      "base-uri 'self'",
      "object-src 'none'",
      "frame-ancestors 'none'",
      "form-action 'self'",
      "img-src 'self' data: blob:",
      "connect-src 'self'",
      "https://*.supabase.co",
      "wss://*.supabase.co",
    ],
  },
  {
    absent: true,
    header: "x-powered-by",
  },
];

const noStoreExpectation: HeaderExpectation = {
  header: "cache-control",
  includes: ["no-store", "max-age=0"],
};

const checks: RouteCheck[] = [
  {
    expectations: globalExpectations,
    label: "public-home",
    path: "/",
  },
  {
    expectations: globalExpectations,
    label: "public-catalog",
    path: "/catalog",
  },
  {
    expectations: [...globalExpectations, noStoreExpectation],
    label: "account",
    path: "/account",
  },
  {
    expectations: [...globalExpectations, noStoreExpectation],
    label: "admin-login",
    path: "/admin/login",
  },
  {
    expectations: [...globalExpectations, noStoreExpectation],
    label: "checkout",
    path: "/checkout",
  },
  {
    expectations: [...globalExpectations, noStoreExpectation],
    label: "products-api",
    path: "/api/products?limit=1&offset=0",
  },
  {
    expectations: [...globalExpectations, noStoreExpectation],
    label: "admin-api-boundary",
    path: "/api/admin/orders",
  },
];

async function main() {
  fs.mkdirSync(ARTIFACT_DIR, { recursive: true });

  const routeResults = [];

  for (const check of checks) {
    const url = new URL(check.path, BASE_URL);
    const response = await fetch(url, {
      headers: {
        accept: check.path.startsWith("/api/")
          ? "application/json"
          : "text/html,application/xhtml+xml",
      },
      redirect: "manual",
    });
    const headers = Object.fromEntries(response.headers.entries());
    const findings = evaluateHeaders(headers, check.expectations);

    routeResults.push({
      findings,
      label: check.label,
      ok: findings.length === 0,
      path: check.path,
      status: response.status,
    });
  }

  const report = {
    baseURL: BASE_URL,
    generatedAt: new Date().toISOString(),
    ok: routeResults.every((result) => result.ok),
    routeResults,
  };

  fs.writeFileSync(
    path.join(ARTIFACT_DIR, "security-posture-check.json"),
    `${JSON.stringify(report, null, 2)}\n`,
  );

  console.log(
    JSON.stringify(
      {
        ok: report.ok,
        routes: routeResults.map((result) => ({
          findings: result.findings.length,
          label: result.label,
          ok: result.ok,
          status: result.status,
        })),
      },
      null,
      2,
    ),
  );

  if (!report.ok) {
    process.exitCode = 1;
  }
}

function evaluateHeaders(
  headers: Record<string, string>,
  expectations: HeaderExpectation[],
) {
  const findings: Array<{
    header: string;
    issue: string;
    value: string | null;
  }> = [];

  for (const expectation of expectations) {
    const value = headers[expectation.header] ?? null;

    if (expectation.absent) {
      if (value !== null) {
        findings.push({
          header: expectation.header,
          issue: "expected header to be absent",
          value,
        });
      }
      continue;
    }

    if (value === null) {
      findings.push({
        header: expectation.header,
        issue: "missing header",
        value,
      });
      continue;
    }

    if (expectation.exact && value !== expectation.exact) {
      findings.push({
        header: expectation.header,
        issue: `expected exact value ${expectation.exact}`,
        value,
      });
    }

    for (const token of expectation.includes ?? []) {
      if (!value.includes(token)) {
        findings.push({
          header: expectation.header,
          issue: `missing token ${token}`,
          value,
        });
      }
    }
  }

  return findings;
}

function parseBaseURL(raw: string) {
  try {
    return new URL(raw).toString();
  } catch {
    throw new Error(`Invalid SECURITY_QA_BASE_URL: ${raw}`);
  }
}

void main();

import { NextResponse } from "next/server";

const APP_LINK_PACKAGE_NAME =
  process.env.MOBILE_ANDROID_PACKAGE_NAME ?? "com.teles23.toqe";

function getSha256Fingerprints(): string[] {
  return (process.env.MOBILE_ANDROID_SHA256_CERT_FINGERPRINTS ?? "")
    .split(",")
    .map((fingerprint) => fingerprint.trim())
    .filter(Boolean);
}

export function GET(): NextResponse {
  const fingerprints = getSha256Fingerprints();

  return NextResponse.json(
    fingerprints.map((fingerprint) => ({
      relation: ["delegate_permission/common.handle_all_urls"],
      target: {
        namespace: "android_app",
        package_name: APP_LINK_PACKAGE_NAME,
        sha256_cert_fingerprints: [fingerprint],
      },
    })),
  );
}


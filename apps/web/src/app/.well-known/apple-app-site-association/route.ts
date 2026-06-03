import { NextResponse } from "next/server";

const MOBILE_IOS_APP_ID =
  process.env.MOBILE_IOS_APP_ID ??
  (process.env.MOBILE_APPLE_TEAM_ID
    ? `${process.env.MOBILE_APPLE_TEAM_ID}.com.teles23.toqe`
    : "");

const PUBLIC_LINK_PATHS = ["/b/*", "/u/*", "/convite*"];

export function GET(): NextResponse {
  return NextResponse.json(
    {
      applinks: {
        apps: [],
        details: MOBILE_IOS_APP_ID
          ? [
              {
                appID: MOBILE_IOS_APP_ID,
                paths: PUBLIC_LINK_PATHS,
              },
            ]
          : [],
      },
    },
    {
      headers: {
        "Content-Type": "application/json",
      },
    },
  );
}

